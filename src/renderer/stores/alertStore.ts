import { create } from 'zustand';
import { AlertConfig } from '../../shared/types';
import { ALERT_THRESHOLDS } from '../../core/constants';

interface AlertState {
  alerts: AlertConfig[];
  isSoundPlaying: boolean;
  currentAlert: AlertConfig | null;
  
  triggerAlert: (threshold: number) => void;
  silenceAlert: (threshold: number) => void;
  setSoundPlaying: (playing: boolean) => void;
  clearCurrentAlert: () => void;
  resetAlerts: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  alerts: ALERT_THRESHOLDS.map(a => ({ ...a })),
  isSoundPlaying: false,
  currentAlert: null,
  
  triggerAlert: (threshold) => set((state) => {
    const alert = state.alerts.find(a => a.threshold === threshold);
    if (alert && !alert.triggered && !alert.silenced) {
      return {
        alerts: state.alerts.map(a => 
          a.threshold === threshold ? { ...a, triggered: true } : a
        ),
        currentAlert: alert
      };
    }
    return state;
  }),
  
  silenceAlert: (threshold) => set((state) => ({
    alerts: state.alerts.map(a => 
      a.threshold === threshold ? { ...a, silenced: true } : a
    ),
    currentAlert: state.currentAlert?.threshold === threshold ? null : state.currentAlert
  })),
  
  setSoundPlaying: (playing) => set({ isSoundPlaying: playing }),
  
  clearCurrentAlert: () => set({ currentAlert: null }),
  
  resetAlerts: () => set({
    alerts: ALERT_THRESHOLDS.map(a => ({ ...a })),
    currentAlert: null,
    isSoundPlaying: false
  })
}));
