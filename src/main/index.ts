import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, shell, Notification, session, net } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import Store from 'electron-store';
import chokidar from 'chokidar';
import { getClaudeLogPaths, parseTokenEvents, getClaudeUserInfo } from '../core/parser/jsonlParser';
import { calculateUsage, calculateResetTimes, formatCountdown } from '../core/calculator/usageCalculator';
import { AppSettings } from '../shared/types';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let settingsStore: Store<Record<string, unknown>>;
let fileWatcher: chokidar.FSWatcher | null = null;
let isQuitting = false;
let loginWindow: BrowserWindow | null = null;
let cachedOrgId: string | null = null;
let cookieStore: Store<Record<string, unknown>> | null = null;
let isWebConnected = false;

const WEB_PARTITION = 'persist:claude-web';

interface SavedCookie {
  url: string;
  name: string;
  value: string;
  domain?: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: string;
  expirationDate?: number;
}

function getWebSession() {
  return session.fromPartition(WEB_PARTITION);
}

/** Save all claude.ai cookies to electron-store for reliable persistence */
async function saveCookiesToStore(): Promise<void> {
  if (!cookieStore) return;
  const webSess = getWebSession();
  const allCookies = await webSess.cookies.get({ url: 'https://claude.ai' });

  const toSave: SavedCookie[] = allCookies.map(c => ({
    url: `https://${(c.domain || 'claude.ai').replace(/^\./, '')}${c.path || '/'}`,
    name: c.name,
    value: c.value,
    domain: c.domain,
    path: c.path,
    secure: c.secure,
    httpOnly: c.httpOnly,
    sameSite: c.sameSite,
    expirationDate: c.expirationDate || (Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60),
  }));

  cookieStore.set('claudeCookies', toSave);
  console.log(`[Cookies] Saved ${toSave.length} cookies`);
}

/** Restore cookies from electron-store into the web session */
async function restoreCookiesFromStore(): Promise<void> {
  if (!cookieStore) return;
  const webSess = getWebSession();
  const saved = cookieStore.get('claudeCookies') as SavedCookie[] | undefined;
  if (!saved || !Array.isArray(saved) || saved.length === 0) {
    console.log('[Cookies] No saved cookies to restore');
    return;
  }

  let restored = 0;
  for (const cookie of saved) {
    try {
      await webSess.cookies.set({
        url: cookie.url,
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite as 'unspecified' | 'no_restriction' | 'lax' | 'strict' | undefined,
        expirationDate: cookie.expirationDate,
      });
      restored++;
    } catch (err) {
      console.error(`[Cookies] Failed to restore cookie ${cookie.name}:`, err);
    }
  }
  console.log(`[Cookies] Restored ${restored}/${saved.length} cookies`);
}

/** Clear saved cookies from store */
function clearCookieStore(): void {
  if (cookieStore) {
    cookieStore.delete('claudeCookies');
    console.log('[Cookies] Cleared');
  }
}

async function makeWebRequest(url: string): Promise<{ status: number; data: unknown; raw: string }> {
  const webSess = getWebSession();

  // Manually build Cookie header — net.request sometimes doesn't attach partition cookies
  const cookies = await webSess.cookies.get({ url: 'https://claude.ai' });
  const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');

  return new Promise((resolve) => {
    const req = net.request({ method: 'GET', url, session: webSess });
    req.setHeader('Accept', 'application/json');
    req.setHeader('User-Agent', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
    req.setHeader('anthropic-client-sha', 'unknown');
    req.setHeader('anthropic-client-platform', 'web');
    if (cookieHeader) {
      req.setHeader('Cookie', cookieHeader);
    }

    let body = '';
    req.on('response', (res) => {
      res.on('data', (chunk: Buffer) => { body += chunk.toString(); });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode || 0, data: JSON.parse(body), raw: body });
        } catch {
          resolve({ status: res.statusCode || 0, data: null, raw: body });
        }
      });
    });
    req.on('error', (err) => {
      console.error('[WebReq] Error fetching', url, err);
      resolve({ status: 0, data: null, raw: '' });
    });
    req.end();
  });
}

interface OrgInfo {
  uuid: string;
  name: string;
  billingType: string;
  capabilities: string[];
  rateLimitTier: string;
}

let cachedBootstrap: Record<string, unknown> | null = null;
let allOrgs: OrgInfo[] = [];

async function getBootstrapData(): Promise<Record<string, unknown> | null> {
  if (cachedBootstrap) return cachedBootstrap;

  const bootstrap = await makeWebRequest('https://claude.ai/api/bootstrap');
  console.log('[WebAPI] Bootstrap status:', bootstrap.status);

  if (bootstrap.status !== 200 || !bootstrap.data) return null;

  cachedBootstrap = bootstrap.data as Record<string, unknown>;
  return cachedBootstrap;
}

async function getOrgId(): Promise<string | null> {
  if (cachedOrgId) return cachedOrgId;

  const data = await getBootstrapData();
  if (!data) return null;

  // Extract ALL organizations from memberships
  allOrgs = [];
  if (data.account && typeof data.account === 'object') {
    const account = data.account as Record<string, unknown>;

    if (account.memberships && Array.isArray(account.memberships)) {
      for (const membership of account.memberships) {
        const m = membership as Record<string, unknown>;
        if (m.organization && typeof m.organization === 'object') {
          const org = m.organization as Record<string, unknown>;
          if (org.uuid) {
            allOrgs.push({
              uuid: org.uuid as string,
              name: (org.name as string) || 'Unknown',
              billingType: (org.billing_type as string) || '',
              capabilities: (org.capabilities as string[]) || [],
              rateLimitTier: (org.rate_limit_tier as string) || '',
            });
          }
        }
      }
    }
  }

  console.log('[WebAPI] Found', allOrgs.length, 'organizations');

  // Also check lastActiveOrg cookie
  const webSess = getWebSession();
  const cookies = await webSess.cookies.get({ url: 'https://claude.ai', name: 'lastActiveOrg' });
  const lastActiveOrg = cookies.length > 0 ? cookies[0].value : null;
  console.log('[WebAPI] lastActiveOrg:', lastActiveOrg ? 'found' : 'not found');

  // Priority: use lastActiveOrg if it's in our list
  if (lastActiveOrg) {
    const found = allOrgs.find(o => o.uuid === lastActiveOrg);
    if (found) {
      cachedOrgId = found.uuid;
      console.log('[WebAPI] Using lastActiveOrg');
      return cachedOrgId;
    }
    // Even if not in our membership list, try it — it might be a personal org
    cachedOrgId = lastActiveOrg;
    console.log('[WebAPI] Using lastActiveOrg (external)');
    return cachedOrgId;
  }

  // Fallback: prefer non-API org (claude.ai subscription org)
  const nonApiOrg = allOrgs.find(o => !o.capabilities.includes('api') || o.billingType !== 'prepaid');
  if (nonApiOrg) {
    cachedOrgId = nonApiOrg.uuid;
    console.log('[WebAPI] Using non-API org');
    return cachedOrgId;
  }

  // Last resort: first org
  if (allOrgs.length > 0) {
    cachedOrgId = allOrgs[0].uuid;
    console.log('[WebAPI] Using first org');
    return cachedOrgId;
  }

  console.log('[WebAPI] No org found');
  return null;
}

async function isWebSessionValid(): Promise<boolean> {
  try {
    // Bootstrap always returns 200, but account is null if not authenticated
    const result = await makeWebRequest('https://claude.ai/api/bootstrap');
    if (result.status !== 200 || !result.data) return false;
    const data = result.data as Record<string, unknown>;
    // If account is not null, the session is valid
    return data.account !== null && data.account !== undefined;
  } catch {
    return false;
  }
}

async function fetchAllWebUsage(): Promise<{ connected: boolean; usage: unknown; limits: unknown }> {
  // Step 1: Get bootstrap + org ID
  const data = await getBootstrapData();
  if (!data || !data.account) {
    console.log('[WebAPI] No account data — session invalid');
    cachedBootstrap = null; // Force refresh next time
    return { connected: false, usage: null, limits: null };
  }

  const orgId = await getOrgId();
  if (!orgId) {
    return { connected: false, usage: null, limits: null };
  }

  // Step 2: Fetch actual usage data from working endpoints
  const endpoints = [
    { key: 'usage', url: `https://claude.ai/api/organizations/${orgId}/usage` },
    { key: 'rate_limits', url: `https://claude.ai/api/organizations/${orgId}/rate_limits` },
    { key: 'chat_conversations', url: `https://claude.ai/api/organizations/${orgId}/chat_conversations?limit=5` },
  ];

  const results: Record<string, unknown> = {};

  const fetches = endpoints.map(async (ep) => {
    const res = await makeWebRequest(ep.url);
    if (res.status === 200 && res.data) {
      results[ep.key] = res.data;
    }
  });
  await Promise.all(fetches);

  // Step 3: Extract account info from bootstrap
  const account = data.account as Record<string, unknown>;
  const accountInfo: Record<string, unknown> = {
    email: account.email_address,
    name: account.full_name,
    display_name: account.display_name,
  };

  // Extract org info (current org)
  const currentOrg = allOrgs.find(o => o.uuid === orgId);
  if (currentOrg) {
    accountInfo.organization = currentOrg.name;
    accountInfo.billing_type = currentOrg.billingType;
    accountInfo.rate_limit_tier = currentOrg.rateLimitTier;
    accountInfo.capabilities = currentOrg.capabilities;
  }

  // All orgs for context
  if (allOrgs.length > 1) {
    accountInfo.all_organizations = allOrgs.map(o => ({
      name: o.name,
      uuid: o.uuid,
      billing_type: o.billingType,
      rate_limit_tier: o.rateLimitTier,
    }));
  }

  results['account_info'] = accountInfo;

  return {
    connected: true,
    usage: results,
    limits: { orgId, orgName: currentOrg?.name || 'Unknown' },
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
    name: 'dogclaud-settings',
    defaults: DEFAULT_SETTINGS as unknown as Record<string, unknown>
  });
  cookieStore = new Store<Record<string, unknown>>({
    name: 'claude-web-cookies',
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

  if (process.env.VITE_DEV_SERVER === 'true') {
    mainWindow.loadURL('http://localhost:61983');
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

function createTrayIcon(_percentage: number, color: string): Electron.NativeImage {
  const colorMap: Record<string, string> = {
    '#22C55E': 'dog-emoji-green.png',
    '#3B82F6': 'dog-emoji-blue.png',
    '#EAB308': 'dog-emoji-yellow.png',
    '#F97316': 'dog-emoji-orange.png',
    '#EF4444': 'dog-emoji-red.png',
    '#DC2626': 'dog-emoji-red.png',
    '#B91C1C': 'dog-emoji-red.png',
    '#FBBF24': 'dog-emoji-yellow.png',
  };
  
  const colorKey = (color || '#22C55E').toUpperCase();
  const iconFile = colorMap[colorKey] || 'dog-emoji-green.png';
  const iconPath = path.join(__dirname, '../../assets', iconFile);
  
  if (fs.existsSync(iconPath)) {
    return nativeImage.createFromPath(iconPath);
  }
  
  const fallback = nativeImage.createEmpty();
  return fallback;
}

function createTray(): void {
  const dogIconPath = path.join(__dirname, '../../assets/dog-emoji-green.png');
  let icon: Electron.NativeImage;
  
  if (fs.existsSync(dogIconPath)) {
    icon = nativeImage.createFromPath(dogIconPath);
  } else {
    icon = createTrayIcon(0, '#22C55E');
  }
  
  tray = new Tray(icon);
  tray.setToolTip('DogClaud - Sin sesión web');

  updateTrayMenu(-1, -1);
  
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
  const noSession = sessionPercentage < 0;
  const sessionPctClamped = Math.max(0, Math.min(Math.round(sessionPercentage), 100));
  const weeklyPctClamped = Math.max(0, Math.min(Math.round(weeklyPercentage), 100));

  const contextMenu = Menu.buildFromTemplate([
    { label: `⚙️ Plan: ${(settings.plan || 'pro').toUpperCase()}`, enabled: false },
    { type: 'separator' },
    { label: noSession ? '📊 Sesión: --' : `📊 Sesión: ${sessionPctClamped}%`, enabled: false },
    { label: noSession ? '📅 Semanal: --' : `📅 Semanal: ${weeklyPctClamped}%`, enabled: false },
    { type: 'separator' },
    { label: noSession ? '🔌 Sin sesión web' : '🌐 Sesión web activa', enabled: false },
    { type: 'separator' },
    { label: '🔓 Abrir ventana principal', click: () => mainWindow?.show() },
    { type: 'separator' },
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
    
    // When not connected to web, show neutral tray (no data)
    if (!isWebConnected) {
      if (tray) {
        tray.setToolTip('DogClaud - Sin sesión web');
      }
      updateTrayMenu(-1, -1);
    }

    // Send JSONL data to renderer (for internal tracking, renderer decides what to show)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('usage-update', {
        ...usage,
        sessionResetTime: resetTimes.sessionResetTime,
        weeklyResetTime: resetTimes.weeklyResetTime
      });
    }
    
  } catch (error) {
    console.error('Error updating usage:', error);
  }
}

function getColorForPercentage(percentage: number): string {
  if (percentage >= 100) return '#EF4444';
  if (percentage >= 95)  return '#DC2626';
  if (percentage >= 90)  return '#F97316';
  if (percentage >= 75)  return '#EAB308';
  if (percentage >= 50)  return '#EAB308';
  if (percentage >= 25)  return '#3B82F6';
  return '#22C55E';
}

const alertedThresholds = new Set<number>();
let hasInitialSyncCompleted = false;

function checkAlerts(percentage: number, alertsEnabled: boolean): void {
  if (!alertsEnabled) return;
  if (!hasInitialSyncCompleted) return;

  const messages: Record<number, string> = {
    25: 'Uso al 25% - Comenzando',
    50: 'Uso al 50% - Mitad de camino',
    75: 'Uso al 75% - Precaución',
    90: 'Uso al 90% - ¡Cuidado!',
    95: '¡CRÍTICO! 95% usado',
    100: '¡LÍMITE ALCANZADO!'
  };

  const colorMap: Record<string, string> = {
    '#22C55E': 'dog-emoji-green.png',
    '#3B82F6': 'dog-emoji-blue.png',
    '#EAB308': 'dog-emoji-yellow.png',
    '#F97316': 'dog-emoji-orange.png',
    '#EF4444': 'dog-emoji-red.png',
    '#DC2626': 'dog-emoji-red.png',
    '#B91C1C': 'dog-emoji-red.png',
    '#FBBF24': 'dog-emoji-yellow.png',
  };

  // Find the highest threshold that's been crossed and not yet alerted
  const thresholds = [100, 95, 90, 75, 50, 25]; // highest first

  for (const threshold of thresholds) {
    if (percentage >= threshold && !alertedThresholds.has(threshold)) {
      // Mark this AND all lower thresholds as alerted (so they never fire)
      for (const t of [25, 50, 75, 90, 95, 100]) {
        if (t <= threshold) alertedThresholds.add(t);
      }

      const alertColor = getColorForPercentage(threshold);
      const iconFile = colorMap[alertColor] || 'dog-emoji-green.png';
      const iconPath = path.join(__dirname, '../../assets', iconFile);
      const iconData = fs.existsSync(iconPath) ? nativeImage.createFromPath(iconPath) : undefined;

      new Notification({
        title: '🐕 DogClaud',
        body: messages[threshold],
        urgency: threshold >= 95 ? 'critical' : 'normal',
        icon: iconData
      }).show();

      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('show-alert', { threshold, message: messages[threshold] });
      }
      break; // Only fire ONE notification — the highest crossed threshold
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
    const cookies = await webSess.cookies.get({ url: 'https://claude.ai' });
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
          await new Promise(r => setTimeout(r, 2000));

          // Save cookies to electron-store for reliable persistence across restarts
          await saveCookiesToStore();

          cachedOrgId = null; // Force re-fetch of org ID

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
    cachedOrgId = null;
    cachedBootstrap = null;
    allOrgs = [];
    clearCookieStore();
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
  
  ipcMain.on('update-tray-icon', (_event, percentage: number, color: string, resetTime?: string) => {
    if (tray) {
      const icon = createTrayIcon(percentage, color);
      tray.setImage(icon);
      const timeStr = resetTime || '--:--';
      tray.setToolTip(`DogClaud\nSesión: ${Math.round(percentage)}% | Reset: ${timeStr}`);
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

app.whenReady().then(async () => {
  initStore();

  // Restore web session cookies BEFORE anything else
  await restoreCookiesFromStore();

  createWindow();
  createTray();
  setupIPC();
  setupAutoStart();
  setupFileWatcher();

  // Initial update
  setTimeout(updateUsage, 2000);

  // Periodic update every 5 seconds (CLI local data)
  setInterval(updateUsage, 5000);

  // Fallback: if web sync hasn't completed after 15s, enable alerts from JSONL
  // Pre-populate ALL exceeded thresholds — no alerts on startup
  setTimeout(async () => {
    if (!hasInitialSyncCompleted) {
      hasInitialSyncCompleted = true;
      try {
        const settings = settingsStore.store as unknown as AppSettings;
        const paths = getClaudeLogPaths();
        const allEvts: import('../shared/types').TokenEvent[] = [];
        for (const fp of paths) {
          const events = await parseTokenEvents(fp, 0);
          allEvts.push(...events);
        }
        const usage = calculateUsage(allEvts, settings.plan);
        const pct = usage.sessionLimit > 0 ? (usage.sessionTokens / usage.sessionLimit) * 100 : 0;
        const thresholds = [25, 50, 75, 90, 95, 100];
        for (const t of thresholds) {
          if (pct >= t) alertedThresholds.add(t);
        }
      } catch { /* ignore */ }
    }
  }, 15000);

  // Periodic web usage update every 30 seconds
  const pushWebUsage = async () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;

    const result = await fetchAllWebUsage();
    isWebConnected = result.connected;

    // After first successful web sync, mark ALL exceeded thresholds as already alerted
    // No alerts on startup — only fire for NEW threshold crossings after this point
    if (result.connected && !hasInitialSyncCompleted) {
      hasInitialSyncCompleted = true;
      const usageForSync = result.usage as Record<string, unknown> | null;
      if (usageForSync) {
        const fhSync = usageForSync.usage as Record<string, unknown> | undefined;
        if (fhSync) {
          const fhData = fhSync.five_hour as { utilization?: number } | undefined;
          if (fhData && typeof fhData.utilization === 'number') {
            const pct = Math.min(fhData.utilization, 100);
            const thresholds = [25, 50, 75, 90, 95, 100];
            for (const t of thresholds) {
              if (pct >= t) alertedThresholds.add(t);
            }
          }
        }
      }
    }

    if (result.connected) {
      mainWindow.webContents.send('web-usage-update', result);
      // Re-save cookies periodically to keep them fresh
      await saveCookiesToStore();

      // Update tray icon from web API data
      const usageData = result.usage as Record<string, unknown> | null;
      if (usageData) {
        const fiveHour = usageData.usage as Record<string, unknown> | undefined;
        if (fiveHour) {
          const fh = fiveHour.five_hour as { utilization?: number; resets_at?: string } | undefined;
          if (fh && typeof fh.utilization === 'number') {
            const settings = settingsStore.store as unknown as AppSettings;
            const pct = Math.min(fh.utilization, 100);
            const color = getColorForPercentage(pct);
            const icon = createTrayIcon(pct, color);
            if (tray) {
              tray.setImage(icon);
              const resetTime = fh.resets_at
                ? formatCountdown(new Date(fh.resets_at))
                : '--:--';
              tray.setToolTip(`DogClaud\nSesión: ${Math.round(pct)}% | Reset: ${resetTime}`);
            }
            const sd = fiveHour.seven_day as { utilization?: number } | undefined;
            const weeklyPct = Math.min(sd?.utilization ?? 0, 100);
            updateTrayMenu(pct, weeklyPct);

            // Check alerts using web percentage (single source of truth when connected)
            checkAlerts(pct, settings.alertsEnabled as boolean);
          }
        }
      }
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

app.on('before-quit', async () => {
  isQuitting = true;
  if (fileWatcher) {
    fileWatcher.close();
  }
  // Save cookies one last time before quitting
  await saveCookiesToStore();
});
