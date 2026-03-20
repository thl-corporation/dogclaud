export type PlanType = 'pro' | 'max5' | 'max20';

export interface PlanLimits {
  sessionTokens: number;
  weeklyTokens: number;
  sessionHours: number;
}

export interface UsageData {
  sessionTokens: number;
  weeklyTokens: number;
  sessionLimit: number;
  weeklyLimit: number;
  sessionStartTime: Date | null;
  weeklyStartTime: Date | null;
}

export interface SessionReset {
  sessionResetTime: Date;
  weeklyResetTime: Date;
}

export interface AlertConfig {
  threshold: number;
  frequency: number;
  color: string;
  message: string;
  triggered: boolean;
  silenced: boolean;
}

export interface Schedule {
  id: string;
  name: string;
  intervals: ScheduleInterval[];
  enabled: boolean;
}

export interface ScheduleInterval {
  id: string;
  dayOfWeek: number;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  maxTokens?: number;
  intervalHours: number;
}

export interface AppSettings {
  plan: PlanType;
  timezone: string;
  alertsEnabled: boolean;
  soundVolume: number;
  startMinimized: boolean;
  startWithSystem: boolean;
  schedule: Schedule | null;
  alertedThresholds: number[];
}

export interface TokenEvent {
  type: 'input' | 'output' | 'cache_create' | 'cache_read';
  tokens: number;
  timestamp: number;
  sessionId?: string;
}

export interface ParsedFile {
  path: string;
  lastPosition: number;
  events: TokenEvent[];
}

export type UsageUpdateCallback = (usage: UsageData) => void;

export interface IElectronAPI {
  checkSetup: () => Promise<{ installed: boolean; loggedIn: boolean; claudeDir: string }>;
  openInstallUrl: () => Promise<void>;
  getUsageData: () => Promise<UsageData & { sessionResetTime: Date; weeklyResetTime: Date }>;
  onUsageUpdate: (callback: (usage: UsageData & { sessionResetTime: Date; weeklyResetTime: Date }) => void) => void;
  getSettings: () => Promise<AppSettings>;
  saveSettings: (settings: Partial<AppSettings>) => Promise<void>;
  getUserInfo: () => Promise<{ email?: string; plan?: string }>;
  minimizeToTray: () => void;
  showWindow: () => void;
  quit: () => void;
  updateTrayIcon: (percentage: number, color: string) => void;
  updateTrayTooltip: (sessionPct: number, weeklyPct: number) => void;
  silenceAlert: (threshold: number) => void;
  onShowAlert: (callback: (data: { threshold: number; message: string }) => void) => void;
  checkWebSession: () => Promise<{ connected: boolean }>;
  openWebLogin: () => Promise<{ success: boolean }>;
  getWebUsage: () => Promise<{ connected: boolean; usage: unknown; limits: unknown }>;
  disconnectWeb: () => Promise<{ success: boolean }>;
  onWebSessionChanged: (callback: (data: { connected: boolean }) => void) => void;
  onWebUsageUpdate: (callback: (data: { connected: boolean; usage: unknown; limits: unknown }) => void) => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
