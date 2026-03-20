import { useAlertStore } from '../../stores/alertStore';
import { ALERT_THRESHOLDS } from '../../../core/constants';

interface AlertManagerProps {
  currentPercentage: number;
  onSilence: (threshold: number) => void;
}

export const AlertManager: React.FC<AlertManagerProps> = ({ currentPercentage, onSilence }) => {
  const { alerts, currentAlert, isSoundPlaying, silenceAlert } = useAlertStore();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: '2px', textTransform: 'uppercase' }}>
          Umbrales de Alerta
        </span>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>
          Click para silenciar
        </span>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {ALERT_THRESHOLDS.map((threshold) => {
          const alert = alerts.find(a => a.threshold === threshold.threshold);
          const isTriggered = alert?.triggered && !alert?.silenced;
          const isActive = currentPercentage >= threshold.threshold;

          return (
            <button
              key={threshold.threshold}
              onClick={() => onSilence(threshold.threshold)}
              title={`Silenciar alerta ${threshold.threshold}%`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '20px',
                border: `1px solid ${isActive ? threshold.color + '88' : 'rgba(255,255,255,0.08)'}`,
                background: isActive
                  ? `${threshold.color}22`
                  : 'rgba(255,255,255,0.04)',
                color: isActive ? threshold.color : 'rgba(255,255,255,0.3)',
                fontWeight: 700,
                fontSize: '12px',
                cursor: isActive ? 'pointer' : 'default',
                transition: 'all 0.3s ease',
                boxShadow: isTriggered ? `0 0 12px ${threshold.color}44` : 'none',
                letterSpacing: '0.5px',
              }}
            >
              {isTriggered && (
                <span style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: threshold.color,
                  boxShadow: `0 0 6px ${threshold.color}`,
                  animation: 'pulse 1s infinite',
                  flexShrink: 0,
                }} />
              )}
              {threshold.threshold}%
            </button>
          );
        })}
      </div>

      {isSoundPlaying && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          background: 'rgba(251,191,36,0.1)',
          border: '1px solid rgba(251,191,36,0.25)',
          borderRadius: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>🔊</span>
            <span style={{ fontSize: '13px', color: '#fbbf24', fontWeight: 500 }}>
              Reproduciendo alerta...
            </span>
          </div>
          <button
            onClick={() => currentAlert && silenceAlert(currentAlert.threshold)}
            style={{
              padding: '4px 14px',
              background: 'rgba(239,68,68,0.2)',
              border: '1px solid rgba(239,68,68,0.4)',
              borderRadius: '8px',
              color: '#ef4444',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Silenciar
          </button>
        </div>
      )}

      {currentAlert && (
        <div style={{
          padding: '12px 16px',
          background: `${currentAlert.color}18`,
          border: `1px solid ${currentAlert.color}44`,
          borderRadius: '12px',
          textAlign: 'center',
        }}>
          <p style={{ color: currentAlert.color, fontWeight: 700, fontSize: '14px', margin: 0 }}>
            {currentAlert.message}
          </p>
        </div>
      )}
    </div>
  );
};
