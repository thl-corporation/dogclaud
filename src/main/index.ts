import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, shell, Notification, session, net } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import Store from 'electron-store';
import chokidar from 'chokidar';
import { getClaudeLogPaths, parseTokenEvents, getClaudeUserInfo } from '../core/parser/jsonlParser';
import { calculateUsage, calculateResetTimes } from '../core/calculator/usageCalculator';
import { AppSettings } from '../shared/types';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let settingsStore: Store<Record<string, unknown>>;
let fileWatcher: chokidar.FSWatcher | null = null;
let isQuitting = false;
let loginWindow: BrowserWindow | null = null;

const WEB_PARTITION = 'persist:claude-web';

function getWebSession() {
  return session.fromPartition(WEB_PARTITION);
}

async function isWebSessionValid(): Promise<boolean> {
  try {
    const result = await fetchWebUsageRaw();
    return result.status === 200;
  } catch {
    return false;
  }
}

function fetchWebUsageRaw(): Promise<{ status: number; data: unknown }> {
  return new Promise((resolve) => {
    const webSess = getWebSession();
    const req = net.request({
      method: 'GET',
      url: 'https://claude.ai/api/oauth/usage',
      session: webSess,
    });

    req.setHeader('Accept', 'application/json');
    req.setHeader('User-Agent', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    let body = '';
    req.on('response', (res) => {
      res.on('data', (chunk) => { body += chunk.toString(); });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode || 0, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode || 0, data: null });
        }
      });
    });
    req.on('error', () => resolve({ status: 0, data: null }));
    req.end();
  });
}

async function fetchAllWebUsage(): Promise<{ connected: boolean; usage: unknown; limits: unknown }> {
  const webSess = getWebSession();

  const makeReq = (url: string): Promise<{ status: number; data: unknown }> => new Promise((resolve) => {
    const req = net.request({ method: 'GET', url, session: webSess });
    req.setHeader('Accept', 'application/json');
    req.setHeader('User-Agent', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    let body = '';
    req.on('response', (res) => {
      res.on('data', (c) => { body += c.toString(); });
      res.on('end', () => {
        try { resolve({ status: res.statusCode || 0, data: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode || 0, data: null }); }
      });
    });
    req.on('error', () => resolve({ status: 0, data: null }));
    req.end();
  });

  const [usageRes, limitsRes] = await Promise.all([
    makeReq('https://claude.ai/api/oauth/usage'),
    makeReq('https://claude.ai/api/claude_code/policy_limits'),
  ]);

  return {
    connected: usageRes.status === 200,
    usage: usageRes.data,
    limits: limitsRes.data,
  };
}

const DEFAULT_SETTINGS: AppSettings = {
  plan: 'pro',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  alertsEnabled: true,
  soundVolume: 0.5,
  startMinimized: true,
  startWithSystem: false,
  schedule: null,
  alertedThresholds: []
};

function initStore(): void {
  settingsStore = new Store<Record<string, unknown>>({
    name: 'claude-usage-tracker-settings',
    defaults: DEFAULT_SETTINGS as unknown as Record<string, unknown>
  });
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 750,
    show: !(settingsStore.get('startMinimized') as boolean),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTrayIcon(percentage: number, color: string): Electron.NativeImage {
  const size = 64;
  const pct = Math.round(percentage);
  const fontSize = pct >= 100 ? 16 : pct >= 10 ? 19 : 22;
  const yOffset = size / 2 + fontSize / 2 - 2;

  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 3}" fill="${color}" stroke="rgba(255,255,255,0.95)" stroke-width="4"/>
    <text x="${size/2}" y="${yOffset}" font-size="${fontSize}" fill="white" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold">${pct}%</text>
  </svg>`;

  const buffer = Buffer.from(svg);
  return nativeImage.createFromBuffer(buffer);
}

function createTray(): void {
  const iconPath = path.join(__dirname, '../../assets/icon.png');
  let icon: Electron.NativeImage;
  
  if (fs.existsSync(iconPath)) {
    icon = nativeImage.createFromPath(iconPath);
  } else {
    // Create default icon
    icon = createTrayIcon(0, '#22C55E');
  }
  
  tray = new Tray(icon);
  tray.setToolTip('Claude Usage Tracker - Iniciando...');
  
  updateTrayMenu(0, 0);
  
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

function updateTrayMenu(sessionPercentage: number, weeklyPercentage: number): void {
  if (!tray) return;
  
  const settings = settingsStore.store as unknown as AppSettings;
  const userInfo = getClaudeUserInfo();
  
  const contextMenu = Menu.buildFromTemplate([
    { label: `👤 Usuario: ${userInfo.plan?.toUpperCase() || 'Unknown'}`, enabled: false },
    { type: 'separator' },
    { label: `📊 Sesión: ${Math.round(sessionPercentage)}%`, enabled: false },
    { label: `📅 Semanal: ${Math.round(weeklyPercentage)}%`, enabled: false },
    { type: 'separator' },
    { label: '🔓 Abrir ventana principal', click: () => mainWindow?.show() },
    { label: '💻 Iniciar Claude Code', click: () => shell.openPath('claude') },
    { type: 'separator' },
    { label: `⚙️ Plan: ${(settings.plan || 'pro').toUpperCase()}`, enabled: false },
    { label: `🔔 Alertas: ${settings.alertsEnabled ? 'Activadas' : 'Desactivadas'}`, enabled: false },
    { type: 'separator' },
    { label: '❌ Salir', click: () => { isQuitting = true; app.quit(); } }
  ]);
  
  tray.setContextMenu(contextMenu);
}

function setupFileWatcher(): void {
  const paths = getClaudeLogPaths();
  
  if (fileWatcher) {
    fileWatcher.close();
  }
  
  if (paths.length === 0) {
    console.log('No Claude log paths found');
    return;
  }
  
  fileWatcher = chokidar.watch(paths, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval: 100
    }
  });
  
  fileWatcher.on('change', (filePath) => {
    console.log(`File changed: ${filePath}`);
    updateUsage();
  });
  
  fileWatcher.on('add', (filePath) => {
    console.log(`File added: ${filePath}`);
    updateUsage();
  });
  
  console.log(`Watching ${paths.length} files for changes`);
}

async function updateUsage(): Promise<void> {
  try {
    const settings = settingsStore.store as unknown as AppSettings;
    const paths = getClaudeLogPaths();
    const allEvents: import('../shared/types').TokenEvent[] = [];

    for (const filePath of paths) {
      const events = await parseTokenEvents(filePath, 0);
      allEvents.push(...events);
    }

    const usage = calculateUsage(allEvents, settings.plan);
    const resetTimes = calculateResetTimes(usage.sessionStartTime, usage.weeklyStartTime);
    
    const sessionPct = usage.sessionLimit > 0 ? (usage.sessionTokens / usage.sessionLimit) * 100 : 0;
    const weeklyPct = usage.weeklyLimit > 0 ? (usage.weeklyTokens / usage.weeklyLimit) * 100 : 0;
    
    // Update tray icon
    if (tray) {
      const color = getColorForPercentage(sessionPct);
      const icon = createTrayIcon(sessionPct, color);
      tray.setImage(icon);
      tray.setToolTip(`Claude Usage: ${Math.round(sessionPct)}%`);
    }
    
    updateTrayMenu(sessionPct, weeklyPct);
    
    // Send to renderer
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('usage-update', {
        ...usage,
        sessionResetTime: resetTimes.sessionResetTime,
        weeklyResetTime: resetTimes.weeklyResetTime
      });
    }
    
    // Check alerts
    checkAlerts(sessionPct, settings.alertsEnabled as boolean);
    
  } catch (error) {
    console.error('Error updating usage:', error);
  }
}

function getColorForPercentage(percentage: number): string {
  if (percentage >= 100) return '#EF4444';
  if (percentage >= 95) return '#DC2626';
  if (percentage >= 90) return '#F97316';
  if (percentage >= 75) return '#FBBF24';
  if (percentage >= 50) return '#22C55E';
  if (percentage >= 25) return '#3B82F6';
  return '#22C55E';
}

const alertedThresholds = new Set<number>();

function checkAlerts(percentage: number, alertsEnabled: boolean): void {
  if (!alertsEnabled) return;
  
  const thresholds = [25, 50, 75, 90, 95, 100];
  
  for (const threshold of thresholds) {
    if (percentage >= threshold && !alertedThresholds.has(threshold)) {
      alertedThresholds.add(threshold);
      
      // Show notification
      const messages: Record<number, string> = {
        25: 'Uso al 25% - Comenzando',
        50: 'Uso al 50% - Mitad de camino',
        75: 'Uso al 75% - Precaución',
        90: 'Uso al 90% - ¡Cuidado!',
        95: '¡CRÍTICO! 95% usado',
        100: '¡LÍMITE ALCANZADO!'
      };
      
      new Notification({
        title: 'Claude Usage Tracker',
        body: messages[threshold],
        urgency: threshold >= 95 ? 'critical' : 'normal'
      }).show();
      
      // Send to renderer
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('show-alert', { threshold, message: messages[threshold] });
      }
    }
  }
}

function checkClaudeSetup(): { installed: boolean; loggedIn: boolean; claudeDir: string } {
  const homeDir = os.homedir();
  const claudeDir = path.join(homeDir, '.claude');
  const credentialsPath = path.join(claudeDir, '.credentials.json');
  const projectsDir = path.join(claudeDir, 'projects');

  const loggedIn = fs.existsSync(credentialsPath) && fs.existsSync(projectsDir);

  // Check if claude CLI is installed: look in PATH and common locations
  const candidates = [
    'claude',
    path.join(homeDir, '.local', 'bin', 'claude'),
    path.join(homeDir, '.local', 'share', 'claude', 'current'),
    '/usr/local/bin/claude',
    '/usr/bin/claude',
    // Windows
    path.join(homeDir, 'AppData', 'Local', 'Programs', 'claude', 'claude.exe'),
    // macOS
    '/opt/homebrew/bin/claude',
  ];

  let installed = false;
  for (const candidate of candidates) {
    try {
      if (candidate === 'claude') {
        // Check PATH
        const result = require('child_process').spawnSync('which', ['claude'], { encoding: 'utf8' });
        const resultWhere = require('child_process').spawnSync('where', ['claude'], { encoding: 'utf8' });
        if ((result.status === 0 && result.stdout.trim()) || (resultWhere.status === 0)) {
          installed = true;
          break;
        }
      } else if (fs.existsSync(candidate)) {
        installed = true;
        break;
      }
    } catch {
      // continue
    }
  }

  // If credentials exist, CLI was definitely installed at some point
  if (loggedIn) installed = true;

  return { installed, loggedIn, claudeDir };
}

function setupIPC(): void {
  ipcMain.handle('check-setup', () => {
    return checkClaudeSetup();
  });

  ipcMain.handle('open-install-url', () => {
    shell.openExternal('https://claude.ai/download');
  });

  // ── Web session IPC ──────────────────────────────────────────────────────

  ipcMain.handle('check-web-session', async () => {
    const webSess = getWebSession();
    const cookies = await webSess.cookies.get({ domain: 'claude.ai' });
    if (cookies.length === 0) return { connected: false };
    const valid = await isWebSessionValid();
    return { connected: valid };
  });

  ipcMain.handle('open-web-login', () => {
    return new Promise<{ success: boolean }>((resolve) => {
      if (loginWindow && !loginWindow.isDestroyed()) {
        loginWindow.focus();
        resolve({ success: false });
        return;
      }

      loginWindow = new BrowserWindow({
        width: 960,
        height: 720,
        title: 'Iniciar sesión en Claude',
        webPreferences: {
          partition: WEB_PARTITION,       // persistent, survives restarts
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      loginWindow.loadURL('https://claude.ai/login');

      // Detect successful login by watching URL changes
      const onNavigate = async (_e: Electron.Event, url: string) => {
        const isHome = /^https:\/\/claude\.ai\/(new|chats?|$)/.test(url) || url === 'https://claude.ai/';
        if (isHome) {
          // Give the page a moment to set all cookies
          await new Promise(r => setTimeout(r, 1500));
          if (loginWindow && !loginWindow.isDestroyed()) loginWindow.close();
          resolve({ success: true });
          // Notify renderer
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('web-session-changed', { connected: true });
          }
        }
      };

      loginWindow.webContents.on('did-navigate', onNavigate);
      loginWindow.webContents.on('did-navigate-in-page', onNavigate);

      loginWindow.on('closed', () => {
        loginWindow = null;
        resolve({ success: false });
      });
    });
  });

  ipcMain.handle('get-web-usage', async () => {
    return fetchAllWebUsage();
  });

  ipcMain.handle('disconnect-web', async () => {
    const webSess = getWebSession();
    await webSess.clearStorageData({ storages: ['cookies', 'localstorage', 'cachestorage'] });
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('web-session-changed', { connected: false });
    }
    return { success: true };
  });

  // ─────────────────────────────────────────────────────────────────────────

  ipcMain.handle('get-settings', () => {
    return settingsStore.store as unknown as AppSettings;
  });
  
  ipcMain.handle('save-settings', (_event, newSettings: Partial<AppSettings>) => {
    for (const [key, value] of Object.entries(newSettings)) {
      settingsStore.set(key, value);
    }
    
    // Restart file watcher if plan changed
    if (newSettings.plan) {
      setupFileWatcher();
    }
  });
  
  ipcMain.handle('get-usage-data', async () => {
    const settings = settingsStore.store as unknown as AppSettings;
    const paths = getClaudeLogPaths();
    const allEvents: import('../shared/types').TokenEvent[] = [];

    for (const filePath of paths) {
      const events = await parseTokenEvents(filePath, 0);
      allEvents.push(...events);
    }

    const usage = calculateUsage(allEvents, settings.plan);
    const resetTimes = calculateResetTimes(usage.sessionStartTime, usage.weeklyStartTime);

    return {
      ...usage,
      sessionResetTime: resetTimes.sessionResetTime,
      weeklyResetTime: resetTimes.weeklyResetTime
    };
  });
  
  ipcMain.handle('get-user-info', () => {
    return getClaudeUserInfo();
  });
  
  ipcMain.handle('silence-alert', (_event, threshold: number) => {
    alertedThresholds.delete(threshold);
  });
  
  ipcMain.on('update-tray-icon', (_event, percentage: number, color: string) => {
    if (tray) {
      const icon = createTrayIcon(percentage, color);
      tray.setImage(icon);
      tray.setToolTip(`Claude Usage Tracker - Sesión: ${Math.round(percentage)}%`);
    }
  });
  
  ipcMain.on('update-tray-tooltip', (_event, sessionPct: number, weeklyPct: number) => {
    updateTrayMenu(sessionPct, weeklyPct);
  });
  
  ipcMain.on('minimize-to-tray', () => {
    mainWindow?.hide();
  });
  
  ipcMain.on('quit-app', () => {
    isQuitting = true;
    app.quit();
  });
}

function setupAutoStart(): void {
  const settings = settingsStore.store as unknown as AppSettings;
  
  app.setLoginItemSettings({
    openAtLogin: settings.startWithSystem as boolean,
    path: app.getPath('exe')
  });
}

app.whenReady().then(() => {
  initStore();
  createWindow();
  createTray();
  setupIPC();
  setupAutoStart();
  setupFileWatcher();
  
  // Initial update
  setTimeout(updateUsage, 2000);

  // Periodic update every 5 seconds (CLI local data)
  setInterval(updateUsage, 5000);

  // Periodic web usage update every 30 seconds
  const pushWebUsage = async () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const result = await fetchAllWebUsage();
    if (result.connected) {
      mainWindow.webContents.send('web-usage-update', result);
    }
  };
  setTimeout(pushWebUsage, 3000);
  setInterval(pushWebUsage, 30000);
});

app.on('window-all-closed', () => {
  // Keep running in tray on Linux/Windows
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else {
    mainWindow?.show();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
  if (fileWatcher) {
    fileWatcher.close();
  }
});
