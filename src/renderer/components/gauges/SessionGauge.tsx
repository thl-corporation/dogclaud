import React from 'react';

interface SessionGaugeProps {
  percentage: number;
  tokens: number;
  limit: number;
  countdown: string;
  color: string;
  showTokens?: boolean;
}

export const SessionGauge: React.FC<SessionGaugeProps> = ({
  percentage,
  tokens,
  limit,
  countdown,
  color,
  showTokens = true,
}) => {
  const size = 220;
  const strokeWidth = 14;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPct = Math.min(percentage, 100);
  const strokeDashoffset = circumference - (clampedPct / 100) * circumference;
  const isBlinking = percentage >= 100;
  const isCritical = percentage >= 90;

  const gradientId = `session-grad-${Math.round(percentage)}`;

  const statusLabel =
    percentage >= 100 ? 'LÍMITE' :
    percentage >= 90  ? 'CRÍTICO' :
    percentage >= 75  ? 'ALERTA' :
    percentage >= 50  ? 'PRECAUCIÓN' :
    percentage >= 25  ? 'INICIANDO' :
    'NORMAL';

  return (
    <div
      style={{
        background: 'linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)',
        border: `1px solid ${isCritical ? color + '55' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: '20px',
        padding: '28px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxShadow: isCritical ? `0 0 30px ${color}22, 0 4px 24px rgba(0,0,0,0.4)` : '0 4px 24px rgba(0,0,0,0.3)',
        animation: isBlinking ? 'pulse 1s infinite' : 'none',
        transition: 'all 0.4s ease',
        flex: 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <div style={{
          width: '8px', height: '8px', borderRadius: '50%',
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}`,
          animation: isCritical ? 'pulse 1s infinite' : 'none'
        }} />
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', letterSpacing: '2px', textTransform: 'uppercase' }}>
          Sesión Actual
        </span>
      </div>

      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.6" />
              <stop offset="100%" stopColor={color} stopOpacity="1" />
            </linearGradient>
            {isCritical && (
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            )}
          </defs>

          {/* Track */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            filter={isCritical ? 'url(#glow)' : undefined}
            style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>

        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: '4px'
        }}>
          <span style={{
            fontSize: '48px', fontWeight: 800, lineHeight: 1,
            color: color,
            textShadow: `0 0 20px ${color}44`,
          }}>
            {Math.round(percentage)}%
          </span>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '1px' }}>
            {countdown}
          </span>
          <span style={{
            fontSize: '10px', fontWeight: 700, letterSpacing: '2px',
            color: color, opacity: 0.85
          }}>
            {statusLabel}
          </span>
        </div>
      </div>

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        {showTokens ? (
          <>
            <p style={{ fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', fontFamily: 'monospace', margin: 0 }}>
              {tokens.toLocaleString()}
              <span style={{ color: 'rgba(255,255,255,0.3)', margin: '0 6px' }}>/</span>
              {limit.toLocaleString()}
            </p>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '4px', letterSpacing: '1px', textTransform: 'uppercase' }}>
              tokens de sesión · 5h
            </p>
          </>
        ) : (
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '4px', letterSpacing: '1px', textTransform: 'uppercase' }}>
            sesión · 5 horas
          </p>
        )}
      </div>
    </div>
  );
};
