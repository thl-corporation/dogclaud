import { useState, useEffect } from 'react';
import { SessionGauge } from './components/gauges/SessionGauge';
import { WeeklyGauge } from './components/gauges/WeeklyGauge';
import { AlertManager } from './components/alerts/AlertManager';
import { WeeklyPlan } from './components/scheduler/WeeklyPlan';
import { SettingsPanel } from './components/settings/SettingsPanel';
import { SetupScreen } from './components/SetupScreen';
import { WebUsagePanel } from './components/WebUsagePanel';
import { useUsageStore } from './stores/usageStore';
import { useSettingsStore } from './stores/settingsStore';
import { useAlertStore } from './stores/alertStore';
import { formatCountdown, formatCountdownWeekly, getPercentageColor } from '../core/calculator/usageCalculator';
import { PlanType, ScheduleInterval } from '../shared/types';

type TabType = 'usage' | 'schedule' | 'settings';
type SetupStatus = 'checking' | 'incomplete' | 'ready';

const TRAFFIC_COLORS = [
  { min: 0,   max: 25,  color: '#22c55e', label: '0–24%',   name: 'Normal' },
  { min: 25,  max: 50,  color: '#3b82f6', label: '25–49%',  name: 'Inicio' },
  { min: 50,  max: 75,  color: '#eab308', label: '50–74%',  name: 'Precaución' },
  { min: 75,  max: 90,  color: '#f97316', label: '75–89%',  name: 'Alerta' },
  { min: 90,  max: 101, color: '#ef4444', label: '90–100%', name: 'Crítico' },
];

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

  const { silenceAlert } = useAlertStore();

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

  const handleSaveSettings = async () => {
    if (window.electronAPI) {
      await window.electronAPI.saveSettings({
        plan: planType,
        alertsEnabled,
        soundVolume,
        startMinimized,
        startWithSystem
      });
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

  const handleUpdateInterval = (_id: string, _updates: Partial<ScheduleInterval>) => {};

  const handleRemoveInterval = (id: string) => {
    if (!schedule) return;
    updateSetting('schedule', {
      ...schedule,
      intervals: schedule.intervals.filter(int => int.id !== id)
    });
  };

  const sessionColor = getPercentageColor(sessionPercentage);
  const weeklyColor = getPercentageColor(weeklyPercentage);

  const sessionCountdown = sessionResetTime
    ? formatCountdown(new Date(sessionResetTime))
    : '--:--';

  const weeklyCountdown = weeklyResetTime
    ? formatCountdownWeekly(new Date(weeklyResetTime))
    : '--';

  const refreshData = async () => {
    if (window.electronAPI) {
      const usage = await window.electronAPI.getUsageData();
      setUsage(usage);
      setIsConnected(true);
    }
  };

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
    }}>

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
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
          >
            ↻
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
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
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

            {/* Gauges */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'stretch' }}>
              <SessionGauge
                percentage={sessionPercentage}
                tokens={sessionTokens}
                limit={sessionLimit}
                countdown={sessionCountdown}
                color={sessionColor}
              />
              <WeeklyGauge
                percentage={weeklyPercentage}
                tokens={weeklyTokens}
                limit={weeklyLimit}
                countdown={weeklyCountdown}
                color={weeklyColor}
              />
            </div>

            {/* Traffic light legend */}
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '16px',
              padding: '16px 20px',
            }}>
              <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', textTransform: 'uppercase' }}>
                Semáforo de uso
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {TRAFFIC_COLORS.map(tc => {
                  const isCurrent = sessionPercentage >= tc.min && sessionPercentage < tc.max;
                  return (
                    <div
                      key={tc.label}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '5px 10px',
                        borderRadius: '20px',
                        background: isCurrent ? `${tc.color}20` : 'transparent',
                        border: `1px solid ${isCurrent ? tc.color + '55' : 'rgba(255,255,255,0.06)'}`,
                        transition: 'all 0.3s',
                      }}
                    >
                      <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: tc.color,
                        boxShadow: isCurrent ? `0 0 8px ${tc.color}` : 'none',
                      }} />
                      <span style={{ fontSize: '11px', fontWeight: isCurrent ? 700 : 400, color: isCurrent ? tc.color : 'rgba(255,255,255,0.4)' }}>
                        {tc.label}
                      </span>
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>
                        {tc.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Web usage panel */}
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
                currentPercentage={sessionPercentage}
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
