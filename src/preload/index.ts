import { contextBridge, ipcRenderer } from 'electron';
import { AppSettings, UsageData } from '../shared/types';

interface UserInfo {
  email?: string;
  plan?: string;
}

contextBridge.exposeInMainWorld('electronAPI', {
  checkSetup: (): Promise<{ installed: boolean; loggedIn: boolean; claudeDir: string }> => {
    return ipcRenderer.invoke('check-setup');
  },

  openInstallUrl: (): Promise<void> => {
    return ipcRenderer.invoke('open-install-url');
  },

  getSettings: (): Promise<AppSettings> => {
    return ipcRenderer.invoke('get-settings');
  },
  
  saveSettings: (settings: Partial<AppSettings>): Promise<void> => {
    return ipcRenderer.invoke('save-settings', settings);
  },
  
  getUsageData: (): Promise<UsageData & { sessionResetTime: Date; weeklyResetTime: Date }> => {
    return ipcRenderer.invoke('get-usage-data');
  },
  
  getUserInfo: (): Promise<UserInfo> => {
    return ipcRenderer.invoke('get-user-info');
  },
  
  onUsageUpdate: (callback: (usage: UsageData & { sessionResetTime: Date; weeklyResetTime: Date }) => void): void => {
    ipcRenderer.on('usage-update', (_event, usage) => callback(usage));
  },
  
  updateTrayIcon: (percentage: number, color: string): void => {
    ipcRenderer.send('update-tray-icon', percentage, color);
  },
  
  updateTrayTooltip: (sessionPct: number, weeklyPct: number): void => {
    ipcRenderer.send('update-tray-tooltip', sessionPct, weeklyPct);
  },
  
  minimizeToTray: (): void => {
    ipcRenderer.send('minimize-to-tray');
  },
  
  showWindow: (): void => {
    ipcRenderer.send('show-window');
  },
  
  quit: (): void => {
    ipcRenderer.send('quit-app');
  },
  
  silenceAlert: (threshold: number): void => {
    ipcRenderer.send('silence-alert', threshold);
  },
  
  onShowAlert: (callback: (data: { threshold: number; message: string }) => void): void => {
    ipcRenderer.on('show-alert', (_event, data) => callback(data));
  },

  checkWebSession: (): Promise<{ connected: boolean }> => {
    return ipcRenderer.invoke('check-web-session');
  },

  openWebLogin: (): Promise<{ success: boolean }> => {
    return ipcRenderer.invoke('open-web-login');
  },

  getWebUsage: (): Promise<{ connected: boolean; usage: unknown; limits: unknown }> => {
    return ipcRenderer.invoke('get-web-usage');
  },

  disconnectWeb: (): Promise<{ success: boolean }> => {
    return ipcRenderer.invoke('disconnect-web');
  },

  onWebSessionChanged: (callback: (data: { connected: boolean }) => void): void => {
    ipcRenderer.on('web-session-changed', (_event, data) => callback(data));
  },

  onWebUsageUpdate: (callback: (data: { connected: boolean; usage: unknown; limits: unknown }) => void): void => {
    ipcRenderer.on('web-usage-update', (_event, data) => callback(data));
  },
});
