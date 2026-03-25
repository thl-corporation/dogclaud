import { create } from 'zustand';
import { AppSettings, Schedule, ScheduleInterval } from '../../shared/types';

interface SettingsState extends AppSettings {
  isLoading: boolean;
  
  loadSettings: (settings: AppSettings) => void;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  setSchedule: (schedule: Schedule) => void;
  updateInterval: (intervalId: string, updates: Partial<ScheduleInterval>) => void;
  addInterval: (scheduleId: string, interval: ScheduleInterval) => void;
  removeInterval: (scheduleId: string, intervalId: string) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  plan: 'pro',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  alertsEnabled: true,
  soundVolume: 0.5,
  startMinimized: true,
  startWithSystem: false,
  schedule: null,
  isLoading: true,
  
  loadSettings: (settings) => set({ ...settings, isLoading: false }),
  
  updateSetting: (key, value) => set(() => ({ [key]: value })),
  
  setSchedule: (schedule) => set({ schedule }),
  
  updateInterval: (intervalId, updates) => set((state) => {
    if (!state.schedule) return state;
    return {
      schedule: {
        ...state.schedule,
        intervals: state.schedule.intervals.map(int =>
          int.id === intervalId ? { ...int, ...updates } : int
        )
      }
    };
  }),
  
  addInterval: (scheduleId, interval) => set((state) => {
    if (!state.schedule || state.schedule.id !== scheduleId) return state;
    return {
      schedule: {
        ...state.schedule,
        intervals: [...state.schedule.intervals, interval]
      }
    };
  }),
  
  removeInterval: (scheduleId, intervalId) => set((state) => {
    if (!state.schedule || state.schedule.id !== scheduleId) return state;
    return {
      schedule: {
        ...state.schedule,
        intervals: state.schedule.intervals.filter(int => int.id !== intervalId)
      }
    };
  })
}));
