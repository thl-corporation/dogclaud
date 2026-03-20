import { useEffect, useRef, useCallback } from 'react';
import { useUsageStore } from '../stores/usageStore';
import { useAlertStore } from '../stores/alertStore';
import { useSettingsStore } from '../stores/settingsStore';
import { playTone, stopSound } from '../../core/audio/toneGenerator';

const UPDATE_INTERVAL = 5000;

export function useClaudeUsage() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const alertedRef = useRef<Set<number>>(new Set());
  
  const { 
    setUsage, 
    sessionPercentage,
    weeklyPercentage,
    planType
  } = useUsageStore();
  
  const { 
    alerts, 
    triggerAlert, 
    silenceAlert, 
    setSoundPlaying,
    currentAlert
  } = useAlertStore();
  
  const { 
    alertsEnabled, 
    soundVolume, 
    loadSettings,
    isLoading 
  } = useSettingsStore();
  
  const fetchUsage = useCallback(async () => {
    try {
      if (window.electronAPI) {
        const usage = await window.electronAPI.getUsageData();
        setUsage(usage);
        
        const sessionPct = usage.sessionLimit > 0 
          ? (usage.sessionTokens / usage.sessionLimit) * 100 
          : 0;
        
        window.electronAPI.updateTrayIcon(
          sessionPct,
          getColorForPercentage(sessionPct)
        );
        
        window.electronAPI.updateTrayTooltip(
          sessionPct,
          usage.weeklyLimit > 0 
            ? (usage.weeklyTokens / usage.weeklyLimit) * 100 
            : 0
        );
      }
    } catch (error) {
      console.error('Error fetching usage:', error);
    }
  }, [setUsage]);
  
  const checkAlerts = useCallback((percentage: number) => {
    if (!alertsEnabled) return;
    
    for (const alert of alerts) {
      if (percentage >= alert.threshold && !alert.triggered && !alert.silenced && !alertedRef.current.has(alert.threshold)) {
        alertedRef.current.add(alert.threshold);
        triggerAlert(alert.threshold);
        setSoundPlaying(true);
        
        playTone(alert.frequency, soundVolume);
        
        break;
      }
    }
  }, [alertsEnabled, alerts, triggerAlert, setSoundPlaying, soundVolume]);
  
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getSettings().then(loadSettings);
      
      window.electronAPI.onUsageUpdate((usage) => {
        setUsage(usage);
        checkAlerts(usage.sessionTokens / usage.sessionLimit * 100);
      });
    }
  }, [loadSettings, setUsage, checkAlerts]);
  
  useEffect(() => {
    if (!isLoading) {
      fetchUsage();
      
      intervalRef.current = setInterval(fetchUsage, UPDATE_INTERVAL);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isLoading, fetchUsage]);
  
  useEffect(() => {
    checkAlerts(sessionPercentage);
  }, [sessionPercentage, checkAlerts]);
  
  const silenceCurrentAlert = useCallback(() => {
    if (currentAlert) {
      silenceAlert(currentAlert.threshold);
      stopSound();
      setSoundPlaying(false);
    }
  }, [currentAlert, silenceAlert, setSoundPlaying]);
  
  return {
    fetchUsage,
    silenceCurrentAlert,
    sessionPercentage,
    weeklyPercentage,
    planType
  };
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
