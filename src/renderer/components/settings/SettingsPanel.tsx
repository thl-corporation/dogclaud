import React from 'react';
import { PlanType } from '../../../shared/types';

interface SettingsPanelProps {
  plan: PlanType;
  alertsEnabled: boolean;
  soundVolume: number;
  startMinimized: boolean;
  startWithSystem: boolean;
  onPlanChange: (plan: PlanType) => void;
  onAlertsToggle: () => void;
  onVolumeChange: (volume: number) => void;
  onStartMinimizedToggle: () => void;
  onStartWithSystemToggle: () => void;
  onSave: () => void;
}

const Toggle: React.FC<{ enabled: boolean; onToggle: () => void }> = ({ enabled, onToggle }) => (
  <button
    onClick={onToggle}
    style={{
      position: 'relative',
      width: '44px',
      height: '24px',
      borderRadius: '12px',
      background: enabled ? '#6366f1' : 'rgba(255,255,255,0.12)',
      border: 'none',
      cursor: 'pointer',
      transition: 'background 0.3s ease',
      flexShrink: 0,
    }}
  >
    <div style={{
      position: 'absolute',
      top: '3px',
      left: enabled ? '23px' : '3px',
      width: '18px',
      height: '18px',
      borderRadius: '50%',
      background: 'white',
      boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      transition: 'left 0.3s ease',
    }} />
  </button>
);

const Row: React.FC<{ label: string; sub?: string; children: React.ReactNode }> = ({ label, sub, children }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 0',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  }}>
    <div>
      <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>{label}</p>
      {sub && <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{sub}</p>}
    </div>
    {children}
  </div>
);

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  plan,
  alertsEnabled,
  soundVolume,
  startMinimized,
  startWithSystem,
  onPlanChange,
  onAlertsToggle,
  onVolumeChange,
  onStartMinimizedToggle,
  onStartWithSystemToggle,
  onSave,
}) => {
  const planInfo: Record<PlanType, { label: string; desc: string }> = {
    pro: { label: 'Claude Pro', desc: '7K tokens/5h · 100K semanales' },
    max5: { label: 'Claude Max ×5', desc: '35K tokens/5h · 500K semanales' },
    max20: { label: 'Claude Max ×20', desc: '140K tokens/5h · 2M semanales' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Plan section */}
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '20px',
      }}>
        <p style={{ margin: '0 0 14px', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', textTransform: 'uppercase' }}>
          Plan Activo
        </p>
        <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
          {(['pro', 'max5', 'max20'] as PlanType[]).map(p => {
            const info = planInfo[p];
            const isSelected = plan === p;
            return (
              <button
                key={p}
                onClick={() => onPlanChange(p)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: `1px solid ${isSelected ? '#6366f1' : 'rgba(255,255,255,0.07)'}`,
                  background: isSelected ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: isSelected ? '#818cf8' : 'rgba(255,255,255,0.75)' }}>
                    {info.label}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                    {info.desc}
                  </p>
                </div>
                {isSelected && (
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: '#6366f1', boxShadow: '0 0 8px #6366f1',
                    flexShrink: 0,
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Alerts section */}
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '20px',
      }}>
        <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', textTransform: 'uppercase' }}>
          Alertas
        </p>

        <Row label="Alertas habilitadas" sub="Notificaciones en umbrales de uso">
          <Toggle enabled={alertsEnabled} onToggle={onAlertsToggle} />
        </Row>

        <div style={{ paddingTop: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)' }}>Volumen de alertas</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#6366f1' }}>{Math.round(soundVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0" max="1" step="0.05"
            value={soundVolume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            disabled={!alertsEnabled}
            style={{
              width: '100%',
              accentColor: '#6366f1',
              opacity: alertsEnabled ? 1 : 0.3,
            }}
          />
        </div>
      </div>

      {/* Startup section */}
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '20px',
      }}>
        <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', textTransform: 'uppercase' }}>
          Inicio
        </p>

        <Row label="Iniciar minimizado" sub="Arranca en la bandeja del sistema">
          <Toggle enabled={startMinimized} onToggle={onStartMinimizedToggle} />
        </Row>
        <Row label="Iniciar con el SO" sub="Se abre automáticamente al iniciar">
          <Toggle enabled={startWithSystem} onToggle={onStartWithSystemToggle} />
        </Row>
      </div>

      <button
        onClick={onSave}
        style={{
          padding: '14px',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          border: 'none',
          borderRadius: '14px',
          color: 'white',
          fontWeight: 700,
          fontSize: '14px',
          cursor: 'pointer',
          letterSpacing: '0.5px',
          boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        Guardar Configuración
      </button>
    </div>
  );
};
