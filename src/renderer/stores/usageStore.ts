import { create } from 'zustand';
import { UsageData, PlanType } from '../../shared/types';
import { PLAN_LIMITS } from '../../core/constants';

interface UsageState {
  sessionTokens: number;
  weeklyTokens: number;
  sessionLimit: number;
  weeklyLimit: number;
  sessionPercentage: number;
  weeklyPercentage: number;
  sessionResetTime: Date | null;
  weeklyResetTime: Date | null;
  sessionStartTime: Date | null;
  weeklyStartTime: Date | null;
  planType: PlanType;
  lastUpdate: Date | null;

  setUsage: (usage: Partial<UsageData> & { sessionResetTime?: Date; weeklyResetTime?: Date }) => void;
  setPlanType: (plan: PlanType) => void;
}

export const useUsageStore = create<UsageState>((set) => ({
  sessionTokens: 0,
  weeklyTokens: 0,
  sessionLimit: PLAN_LIMITS.pro.sessionTokens,
  weeklyLimit: PLAN_LIMITS.pro.weeklyTokens,
  sessionPercentage: 0,
  weeklyPercentage: 0,
  sessionResetTime: null,
  weeklyResetTime: null,
  sessionStartTime: null,
  weeklyStartTime: null,
  planType: 'pro',
  lastUpdate: null,
  
  setUsage: (usage) => set((state) => {
    const sessionTokens = usage.sessionTokens ?? state.sessionTokens;
    const sessionLimit = usage.sessionLimit ?? state.sessionLimit;
    const weeklyTokens = usage.weeklyTokens ?? state.weeklyTokens;
    const weeklyLimit = usage.weeklyLimit ?? state.weeklyLimit;
    
    const sessionPercentage = sessionLimit > 0 ? Math.min((sessionTokens / sessionLimit) * 100, 100) : 0;
    const weeklyPercentage = weeklyLimit > 0 ? Math.min((weeklyTokens / weeklyLimit) * 100, 100) : 0;
    
    return {
      sessionTokens,
      weeklyTokens,
      sessionLimit,
      weeklyLimit,
      sessionPercentage,
      weeklyPercentage,
      sessionResetTime: usage.sessionResetTime ?? state.sessionResetTime,
      weeklyResetTime: usage.weeklyResetTime ?? state.weeklyResetTime,
      sessionStartTime: usage.sessionStartTime ?? state.sessionStartTime,
      weeklyStartTime: usage.weeklyStartTime ?? state.weeklyStartTime,
      lastUpdate: new Date()
    };
  }),
  
  setPlanType: (plan) => {
    const limits = PLAN_LIMITS[plan];
    set((state) => ({
      planType: plan,
      sessionLimit: limits.sessionTokens,
      weeklyLimit: limits.weeklyTokens,
      sessionPercentage: state.sessionTokens > 0
        ? Math.min((state.sessionTokens / limits.sessionTokens) * 100, 100)
        : 0,
      weeklyPercentage: state.weeklyTokens > 0
        ? Math.min((state.weeklyTokens / limits.weeklyTokens) * 100, 100)
        : 0
    }));
  },
}));
