import { useState, useEffect, useCallback, useRef } from 'react';
import { AlertManager } from './components/alerts/AlertManager';
import { WeeklyPlan } from './components/scheduler/WeeklyPlan';
import { SettingsPanel } from './components/settings/SettingsPanel';
import { SetupScreen } from './components/SetupScreen';
import { WebUsagePanel } from './components/WebUsagePanel';
import { SessionGauge } from './components/gauges/SessionGauge';
import { WeeklyGauge } from './components/gauges/WeeklyGauge';
import { useUsageStore } from './stores/usageStore';
import { useSettingsStore } from './stores/settingsStore';
import { useAlertStore } from './stores/alertStore';
import { formatCountdown, formatCountdownWeekly, getPercentageColor } from '../core/calculator/usageCalculator';
import { ALERT_THRESHOLDS } from '../core/constants';
import { playTone, stopSound } from '../core/audio/toneGenerator';
import { PlanType, ScheduleInterval } from '../shared/types';

type TabType = 'usage' | 'schedule' | 'settings';
type SetupStatus = 'checking' | 'incomplete' | 'ready';

function useForceRefresh(intervalMs: number) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}

// #3 - Toast hook for save feedback
function useToast() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const show = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  return { toast, show };
}

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('usage');
  const [userInfo, setUserInfo] = useState<{ email?: string; plan?: string }>({});
  const [isConnected, setIsConnected] = useState(false);
  const [setupStatus, setSetupStatus] = useState<SetupStatus>('checking');
  const [setupInfo, setSetupInfo] = useState<{ installed: boolean; loggedIn: boolean }>({ installed: false, loggedIn: false });
  const [webConnected, setWebConnected] = useState(false);
  const [webUsage, setWebUsage] = useState<unknown>(null);
  const [webLimits, setWebLimits] = useState<unknown>(null);
  const [webConnecting, setWebConnecting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false); // #5

  const { toast, show: showToast } = useToast(); // #3

  // Auto-refresh countdowns and data every 30 seconds
  useForceRefresh(30000);

  const checkSetup = async () => {
    if (!window.electronAPI?.checkSetup) {
      setSetupStatus('ready');
      return;
    }
    const result = await window.electronAPI.checkSetup();
    setSetupInfo(result);
    setSetupStatus(result.loggedIn ? 'ready' : 'incomplete');
  };

  const {
    sessionTokens,
    weeklyTokens,
    sessionLimit,
    weeklyLimit,
    sessionPercentage,
    weeklyPercentage,
    sessionResetTime,
    weeklyResetTime,
    planType,
    lastUpdate,
    setUsage
  } = useUsageStore();

  const {
    alertsEnabled,
    soundVolume,
    startMinimized,
    startWithSystem,
    schedule,
    loadSettings,
    updateSetting
  } = useSettingsStore();

  const { alerts, triggerAlert, silenceAlert, setSoundPlaying } = useAlertStore();
  const alertedRef = useRef<Set<number>>(new Set());

  // Check alerts and play sound when percentage crosses thresholds
  const checkAlerts = useCallback((percentage: number) => {
    if (!alertsEnabled) return;

    for (const threshold of ALERT_THRESHOLDS) {
      if (
        percentage >= threshold.threshold &&
        !alertedRef.current.has(threshold.threshold)
      ) {
        const alert = alerts.find(a => a.threshold === threshold.threshold);
        if (alert && !alert.triggered && !alert.silenced) {
          alertedRef.current.add(threshold.threshold);
          triggerAlert(threshold.threshold);
          setSoundPlaying(true);
          playTone(threshold.frequency, soundVolume);
          setTimeout(() => setSoundPlaying(false), 1000);
          break;
        }
      }
    }
  }, [alertsEnabled, alerts, triggerAlert, setSoundPlaying, soundVolume]);

  useEffect(() => {
    checkSetup();
  }, []);

  useEffect(() => {
    if (setupStatus !== 'ready') return;
    if (!window.electronAPI) return;

    window.electronAPI.getSettings().then(loadSettings);
    window.electronAPI.getUserInfo().then(setUserInfo);

    window.electronAPI.onUsageUpdate((usage) => {
      setUsage(usage);
      setIsConnected(true);
    });

    window.electronAPI.onShowAlert((data) => {
      console.log('Alert received:', data);
    });

    // Web session
    window.electronAPI.checkWebSession().then(({ connected }) => {
      setWebConnected(connected);
      if (connected) {
        window.electronAPI!.getWebUsage().then((r) => {
          setWebUsage(r.usage);
          setWebLimits(r.limits);
        });
      }
    });

    window.electronAPI.onWebSessionChanged(({ connected }) => {
      setWebConnected(connected);
      if (!connected) { setWebUsage(null); setWebLimits(null); }
    });

    window.electronAPI.onWebUsageUpdate((r) => {
      setWebConnected(r.connected);
      if (r.connected) {
        setWebUsage(r.usage);
        setWebLimits(r.limits);
      }
    });
  }, [setupStatus, loadSettings, setUsage]);

  const handleWebConnect = async () => {
    setWebConnecting(true);
    const result = await window.electronAPI?.openWebLogin();
    setWebConnecting(false);
    if (result?.success) {
      setWebConnected(true);
      const r = await window.electronAPI?.getWebUsage();
      if (r) { setWebUsage(r.usage); setWebLimits(r.limits); }
    }
  };

  const handleWebDisconnect = async () => {
    await window.electronAPI?.disconnectWeb();
    setWebConnected(false);
    setWebUsage(null);
    setWebLimits(null);
  };

  const handleSilenceAlert = (threshold: number) => {
    silenceAlert(threshold);
    stopSound();
    setSoundPlaying(false);
    if (window.electronAPI) {
      window.electronAPI.silenceAlert(threshold);
    }
  };

  const handlePlanChange = (plan: PlanType) => {
    updateSetting('plan', plan);
    if (window.electronAPI) {
      window.electronAPI.saveSettings({ plan });
    }
  };

  // #3 - Save with toast feedback
  const handleSaveSettings = async () => {
    if (window.electronAPI) {
      try {
        await window.electronAPI.saveSettings({
          plan: planType,
          alertsEnabled,
          soundVolume,
          startMinimized,
          startWithSystem
        });
        showToast('Configuración guardada');
      } catch {
        showToast('Error al guardar', 'error');
      }
    }
  };

  const handleAddInterval = (interval: ScheduleInterval) => {
    const currentSchedule = schedule || {
      id: Date.now().toString(),
      name: 'Mi Plan',
      intervals: [],
      enabled: true
    };
    updateSetting('schedule', {
      ...currentSchedule,
      intervals: [...currentSchedule.intervals, interval]
    });
  };

  // #4 - Implement interval editing
  const handleUpdateInterval = (id: string, updates: Partial<ScheduleInterval>) => {
    if (!schedule) return;
    updateSetting('schedule', {
      ...schedule,
      intervals: schedule.intervals.map(int =>
        int.id === id ? { ...int, ...updates } : int
      ),
    });
  };

  const handleRemoveInterval = (id: string) => {
    if (!schedule) return;
    updateSetting('schedule', {
      ...schedule,
      intervals: schedule.intervals.filter(int => int.id !== id)
    });
  };

  // Derive real usage from web API if available
  const webData = (webUsage && typeof webUsage === 'object') ? webUsage as Record<string, unknown> : null;
  const webUsageObj = webData?.usage as Record<string, unknown> | undefined;
  const webFiveHour = webUsageObj?.five_hour as { utilization?: number; resets_at?: string } | undefined;
  const webSevenDay = webUsageObj?.seven_day as { utilization?: number; resets_at?: string } | undefined;

  const hasWebData = typeof webFiveHour?.utilization === 'number' || typeof webSevenDay?.utilization === 'number';

  // Use web API data when connected, fallback to JSONL data
  const effectiveSessionPct = hasWebData && typeof webFiveHour?.utilization === 'number'
    ? webFiveHour.utilization > 100
        ? (webFiveHour.utilization / sessionLimit) * 100
        : webFiveHour.utilization
    : sessionPercentage;
  const effectiveWeeklyPct = hasWebData && typeof webSevenDay?.utilization === 'number'
    ? webSevenDay.utilization > 100
        ? (webSevenDay.utilization / weeklyLimit) * 100
        : webSevenDay.utilization
    : weeklyPercentage;

  const sessionCountdown = hasWebData && webFiveHour?.resets_at
    ? formatCountdown(new Date(webFiveHour.resets_at))
    : sessionResetTime
      ? formatCountdown(new Date(sessionResetTime))
      : '--:--';

  const weeklyCountdown = hasWebData && webSevenDay?.resets_at
    ? formatCountdownWeekly(new Date(webSevenDay.resets_at))
    : weeklyResetTime
      ? formatCountdownWeekly(new Date(weeklyResetTime))
      : '--d --h';

  // Update tray icon whenever effective percentages change
  useEffect(() => {
    if (window.electronAPI) {
      const color = getPercentageColor(effectiveSessionPct);
      window.electronAPI.updateTrayIcon(effectiveSessionPct, color, sessionCountdown);
      window.electronAPI.updateTrayTooltip(effectiveSessionPct, effectiveWeeklyPct);
    }
  }, [effectiveSessionPct, effectiveWeeklyPct, sessionCountdown]);

  // Check alerts when session percentage changes
  useEffect(() => {
    checkAlerts(effectiveSessionPct);
  }, [effectiveSessionPct, checkAlerts]);

  // #5 - Refresh with animation
  const refreshData = async () => {
    if (window.electronAPI) {
      setIsRefreshing(true);
      const usage = await window.electronAPI.getUsageData();
      setUsage(usage);
      setIsConnected(true);
      if (webConnected) {
        const r = await window.electronAPI.getWebUsage();
        if (r) { setWebUsage(r.usage); setWebLimits(r.limits); }
      }
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  // #5 - Time since last update
  const getTimeSinceUpdate = (): string => {
    if (!lastUpdate) return '';
    const diff = Date.now() - new Date(lastUpdate).getTime();
    const secs = Math.floor(diff / 1000);
    if (secs < 5) return 'ahora';
    if (secs < 60) return `hace ${secs}s`;
    const mins = Math.floor(secs / 60);
    return `hace ${mins}m`;
  };

  const sessionColor = getPercentageColor(effectiveSessionPct);
  const weeklyColor = getPercentageColor(effectiveWeeklyPct);

  const TABS = [
    { id: 'usage' as TabType, label: 'Uso', icon: '◎' },
    { id: 'schedule' as TabType, label: 'Plan', icon: '⊞' },
    { id: 'settings' as TabType, label: 'Config', icon: '⚙' },
  ];

  // Show loading while checking
  if (setupStatus === 'checking') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #0a0b0f 0%, #111827 60%, #0a0b0f 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(255,255,255,0.4)', fontFamily: 'sans-serif', fontSize: '14px',
      }}>
        Verificando configuración...
      </div>
    );
  }

  // Show setup screen if not ready
  if (setupStatus === 'incomplete') {
    return (
      <SetupScreen
        installed={setupInfo.installed}
        loggedIn={setupInfo.loggedIn}
        onRetry={checkSetup}
      />
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0a0b0f 0%, #111827 60%, #0a0b0f 100%)',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    }}>

      {/* #3 - Toast notification */}
      {toast && (
        <div className="toast-enter" style={{
          position: 'fixed',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          padding: '10px 20px',
          borderRadius: '12px',
          background: toast.type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
          border: `1px solid ${toast.type === 'success' ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
          color: toast.type === 'success' ? '#22c55e' : '#ef4444',
          fontWeight: 600,
          fontSize: '13px',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>
          {toast.type === 'success' ? '✓ ' : '✕ '}{toast.message}
        </div>
      )}

      {/* Header */}
      <header style={{
        padding: '16px 20px',
        background: 'rgba(255,255,255,0.03)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', boxShadow: '0 0 16px rgba(99,102,241,0.5)',
          }}>
            ◈
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '15px', fontWeight: 700, letterSpacing: '0.3px' }}>
              Claude Usage Tracker
            </h1>
            <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.5px' }}>
              {userInfo.plan ? `Plan ${userInfo.plan.toUpperCase()}` : 'Detectando plan...'}
              {/* #5 - Last update indicator */}
              {lastUpdate && (
                <span style={{ marginLeft: '8px', color: 'rgba(255,255,255,0.2)' }}>
                  · {getTimeSinceUpdate()}
                </span>
              )}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '5px 10px', borderRadius: '20px',
            background: isConnected ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${isConnected ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`,
          }}>
            <div style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: isConnected ? '#22c55e' : 'rgba(255,255,255,0.3)',
              boxShadow: isConnected ? '0 0 6px #22c55e' : 'none',
            }} />
            <span style={{ fontSize: '11px', fontWeight: 500, color: isConnected ? '#22c55e' : 'rgba(255,255,255,0.4)' }}>
              {isConnected ? 'Sincronizado' : 'Conectando...'}
            </span>
          </div>

          {/* #5 + #8 - Refresh button with spin animation and focus */}
          <button
            onClick={refreshData}
            title="Actualizar datos"
            style={{
              width: '32px', height: '32px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s',
            }}
          >
            <span style={{
              display: 'inline-block',
              animation: isRefreshing ? 'spin 0.6s linear' : 'none',
            }}>↻</span>
          </button>

          <button
            onClick={() => window.electronAPI?.minimizeToTray()}
            title="Minimizar a bandeja"
            style={{
              width: '32px', height: '32px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              fontSize: '18px', lineHeight: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s',
            }}
          >
            −
          </button>
        </div>
      </header>

      {/* Tab navigation */}
      <nav style={{
        display: 'flex',
        padding: '10px 16px 0',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
        gap: '4px',
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '10px 10px 0 0',
              border: 'none',
              background: activeTab === tab.id ? 'rgba(99,102,241,0.15)' : 'transparent',
              color: activeTab === tab.id ? '#818cf8' : 'rgba(255,255,255,0.4)',
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              borderBottom: activeTab === tab.id ? '2px solid #6366f1' : '2px solid transparent',
              letterSpacing: '0.3px',
            }}
          >
            <span style={{ fontSize: '15px' }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Main content */}
      <main style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>

        {activeTab === 'usage' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Data source indicator */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              padding: '6px 12px',
              background: hasWebData ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${hasWebData ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: '10px',
            }}>
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: hasWebData ? '#818cf8' : '#f97316',
                boxShadow: `0 0 6px ${hasWebData ? '#818cf8' : '#f97316'}`,
              }} />
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>
                {hasWebData ? 'Datos reales de claude.ai API' : 'Estimación desde logs locales JSONL'}
              </span>
            </div>

            {/* #2 + #7 - Gauges side by side */}
            {effectiveSessionPct === 0 && effectiveWeeklyPct === 0 && !hasWebData ? (
              /* #7 - Empty state */
              <div style={{
                padding: '40px 20px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px dashed rgba(255,255,255,0.1)',
                borderRadius: '20px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '40px', marginBottom: '16px', opacity: 0.5 }}>◈</div>
                <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)', margin: '0 0 8px', fontWeight: 600 }}>
                  Sin datos de uso todavía
                </p>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)', margin: 0, maxWidth: '300px', marginInline: 'auto', lineHeight: 1.5 }}>
                  Empieza a usar Claude Code en algún proyecto y verás tu consumo de tokens aquí automáticamente.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '16px' }}>
                <SessionGauge
                  percentage={effectiveSessionPct}
                  tokens={sessionTokens}
                  limit={sessionLimit}
                  countdown={sessionCountdown}
                  color={sessionColor}
                  showTokens={!hasWebData}
                />
                <WeeklyGauge
                  percentage={effectiveWeeklyPct}
                  tokens={weeklyTokens}
                  limit={weeklyLimit}
                  countdown={weeklyCountdown}
                  color={weeklyColor}
                  showTokens={!hasWebData}
                />
              </div>
            )}

            {/* #6 - Web usage panel (collapsible details) */}
            <WebUsagePanel
              connected={webConnected}
              usage={webUsage}
              limits={webLimits}
              onConnect={handleWebConnect}
              onDisconnect={handleWebDisconnect}
              connecting={webConnecting}
            />

            {/* Alerts */}
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '16px',
              padding: '16px 20px',
            }}>
              <AlertManager
                currentPercentage={effectiveSessionPct}
                onSilence={handleSilenceAlert}
              />
            </div>

          </div>
        )}

        {activeTab === 'schedule' && (
          <WeeklyPlan
            intervals={schedule?.intervals || []}
            onAddInterval={handleAddInterval}
            onUpdateInterval={handleUpdateInterval}
            onRemoveInterval={handleRemoveInterval}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPanel
            plan={planType}
            alertsEnabled={alertsEnabled}
            soundVolume={soundVolume}
            startMinimized={startMinimized}
            startWithSystem={startWithSystem}
            onPlanChange={handlePlanChange}
            onAlertsToggle={() => updateSetting('alertsEnabled', !alertsEnabled)}
            onVolumeChange={(v) => updateSetting('soundVolume', v)}
            onStartMinimizedToggle={() => updateSetting('startMinimized', !startMinimized)}
            onStartWithSystemToggle={() => updateSetting('startWithSystem', !startWithSystem)}
            onSave={handleSaveSettings}
          />
        )}
      </main>
    </div>
  );
}

export default App;
