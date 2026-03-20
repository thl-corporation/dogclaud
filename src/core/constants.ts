import { PlanType, PlanLimits, AlertConfig } from '../shared/types';

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  pro: {
    sessionTokens: 7000,
    weeklyTokens: 100000,
    sessionHours: 5
  },
  max5: {
    sessionTokens: 35000,
    weeklyTokens: 500000,
    sessionHours: 5
  },
  max20: {
    sessionTokens: 140000,
    weeklyTokens: 2000000,
    sessionHours: 5
  }
};

export const ALERT_THRESHOLDS: AlertConfig[] = [
  { threshold: 25, frequency: 1000, color: '#3B82F6', message: 'Uso al 25% - Comenzando', triggered: false, silenced: false },
  { threshold: 50, frequency: 1250, color: '#EAB308', message: 'Uso al 50% - Mitad de camino', triggered: false, silenced: false },
  { threshold: 75, frequency: 2000, color: '#F97316', message: 'Uso al 75% - Precaución', triggered: false, silenced: false },
  { threshold: 90, frequency: 2500, color: '#EF4444', message: 'Uso al 90% - ¡Cuidado!', triggered: false, silenced: false },
  { threshold: 95, frequency: 3000, color: '#DC2626', message: '¡CRÍTICO! 95% usado', triggered: false, silenced: false },
  { threshold: 100, frequency: 4000, color: '#B91C1C', message: '¡LÍMITE ALCANZADO!', triggered: false, silenced: false }
];

export const SOUND_DURATION_MS = 200;
export const SOUND_PAUSE_MS = 200;
export const SOUND_REPEATS = 3;

export const DEFAULT_INTERVAL_HOURS = 5;

export const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const CLAUDE_PATHS = {
  settings: '.claude/settings/',
  projects: '.claude/projects/'
};
