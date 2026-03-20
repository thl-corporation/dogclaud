import { TokenEvent, UsageData, PlanType, SessionReset } from '../../shared/types';
import { PLAN_LIMITS, DEFAULT_INTERVAL_HOURS } from '../constants';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

export function calculateUsage(
  events: TokenEvent[],
  planType: PlanType,
  intervalHours: number = DEFAULT_INTERVAL_HOURS
): UsageData {
  const limits = PLAN_LIMITS[planType];
  const now = Date.now();
  
  const windowStart = now - (intervalHours * HOUR_MS);
  const weekStart = now - WEEK_MS;
  
  let sessionTokens = 0;
  let weeklyTokens = 0;
  let sessionStartTime: Date | null = null;
  let weeklyStartTime: Date | null = null;
  
  for (const event of events) {
    const eventTime = event.timestamp;
    
    if (eventTime >= windowStart) {
      sessionTokens += event.tokens;
      if (!sessionStartTime || eventTime < sessionStartTime.getTime()) {
        sessionStartTime = new Date(eventTime);
      }
    }
    
    if (eventTime >= weekStart) {
      weeklyTokens += event.tokens;
      if (!weeklyStartTime || eventTime < weeklyStartTime.getTime()) {
        weeklyStartTime = new Date(eventTime);
      }
    }
  }
  
  return {
    sessionTokens,
    weeklyTokens,
    sessionLimit: limits.sessionTokens,
    weeklyLimit: limits.weeklyTokens,
    sessionStartTime,
    weeklyStartTime
  };
}

export function calculateResetTimes(
  sessionStartTime: Date | null,
  weeklyStartTime: Date | null,
  intervalHours: number = DEFAULT_INTERVAL_HOURS
): SessionReset {
  const now = new Date();
  
  let sessionResetTime: Date;
  if (sessionStartTime) {
    sessionResetTime = new Date(sessionStartTime.getTime() + (intervalHours * HOUR_MS));
    if (sessionResetTime.getTime() <= now.getTime()) {
      sessionResetTime = new Date(now.getTime() + (intervalHours * HOUR_MS));
    }
  } else {
    sessionResetTime = new Date(now.getTime() + (intervalHours * HOUR_MS));
  }
  
  let weeklyResetTime: Date;
  if (weeklyStartTime) {
    weeklyResetTime = new Date(weeklyStartTime.getTime() + WEEK_MS);
    if (weeklyResetTime.getTime() <= now.getTime()) {
      const daysUntilReset = 7 - weeklyStartTime.getDay();
      weeklyResetTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + daysUntilReset,
        0, 0, 0, 0
      );
    }
  } else {
    const daysUntilSunday = (7 - now.getDay()) % 7;
    weeklyResetTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + (daysUntilSunday || 7),
      0, 0, 0, 0
    );
  }
  
  return { sessionResetTime, weeklyResetTime };
}

export function formatCountdown(targetTime: Date): string {
  const now = Date.now();
  const diff = targetTime.getTime() - now;
  
  if (diff <= 0) {
    return '00:00';
  }
  
  const hours = Math.floor(diff / HOUR_MS);
  const minutes = Math.floor((diff % HOUR_MS) / (60 * 1000));
  
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export function formatCountdownWeekly(targetTime: Date): string {
  const now = Date.now();
  const diff = targetTime.getTime() - now;
  
  if (diff <= 0) {
    return '0d 0h';
  }
  
  const days = Math.floor(diff / DAY_MS);
  const hours = Math.floor((diff % DAY_MS) / HOUR_MS);
  
  return `${days}d ${hours}h`;
}

export function getPercentageColor(percentage: number): string {
  if (percentage >= 100) return '#B91C1C';
  if (percentage >= 95) return '#DC2626';
  if (percentage >= 90) return '#EF4444';
  if (percentage >= 75) return '#F97316';
  if (percentage >= 50) return '#EAB308';
  if (percentage >= 25) return '#3B82F6';
  return '#22C55E';
}

export function getAlertThreshold(percentage: number): number | null {
  const thresholds = [100, 95, 90, 75, 50, 25];
  for (const threshold of thresholds) {
    if (percentage >= threshold) {
      return threshold;
    }
  }
  return null;
}
