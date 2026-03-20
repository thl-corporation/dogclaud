import React from 'react';

interface WeeklyGaugeProps {
  percentage: number;
  tokens: number;
  limit: number;
  countdown: string;
  color: string;
  showTokens?: boolean;
}

export const WeeklyGauge: React.FC<WeeklyGaugeProps> = ({
  percentage,
  tokens,
  limit,
  countdown,
  color,
  showTokens = true,
}) => {
  const size = 160;
  const strokeWidth = 10;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPct = Math.min(percentage, 100);
  const strokeDashoffset = circumference - (clampedPct / 100) * circumference;
  const isBlinking = percentage >= 100;
  const isCritical = percentage >= 75;

  const gradientId = `weekly-grad-${Math.round(percentage)}`;

  return (
    <div
      style={{
        background: 'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
        border: `1px solid ${isCritical ? color + '44' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: '20px',
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxShadow: isCritical ? `0 0 20px ${color}18, 0 4px 20px rgba(0,0,0,0.35)` : '0 4px 20px rgba(0,0,0,0.25)',
        animation: isBlinking ? 'pulse 1s infinite' : 'none',
        transition: 'all 0.4s ease',
        flex: 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <div style={{
          width: '6px', height: '6px', borderRadius: '50%',
          backgroundColor: color, boxShadow: `0 0 6px ${color}`
        }} />
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', letterSpacing: '2px', textTransform: 'uppercase' }}>
          Uso Semanal
        </span>
      </div>

      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.5" />
              <stop offset="100%" stopColor={color} stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* Track */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            stroke="rgba(255,255,255,0.05)"
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
            style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>

        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: '2px'
        }}>
          <span style={{
            fontSize: '32px', fontWeight: 800, lineHeight: 1,
            background: `linear-gradient(135deg, ${color}, ${color}bb)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            {Math.round(percentage)}%
          </span>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
            {countdown}
          </span>
        </div>
      </div>

      <div style={{ marginTop: '14px', textAlign: 'center' }}>
        {showTokens ? (
          <>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.75)', fontFamily: 'monospace', margin: 0 }}>
              {tokens.toLocaleString()}
              <span style={{ color: 'rgba(255,255,255,0.3)', margin: '0 5px' }}>/</span>
              {limit.toLocaleString()}
            </p>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '3px', letterSpacing: '1px', textTransform: 'uppercase' }}>
              tokens · 7 días
            </p>
          </>
        ) : (
          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '3px', letterSpacing: '1px', textTransform: 'uppercase' }}>
            semanal · 7 días
          </p>
        )}
      </div>
    </div>
  );
};
