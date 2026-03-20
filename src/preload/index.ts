import { contextBridge, ipcRenderer } from 'electron';
import { AppSettings, UsageData } from '../shared/types';

interface UserInfo {
  email?: string;
  plan?: string;
}

contextBridge.exposeInMainWorld('electronAPI', {
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
  }
});
