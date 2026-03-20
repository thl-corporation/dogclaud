import React, { useState } from 'react';

interface WebUsagePanelProps {
  connected: boolean;
  usage: unknown;
  limits: unknown;
  onConnect: () => void;
  onDisconnect: () => void;
  connecting: boolean;
}

function parseUsageValue(data: unknown, keys: string[]): number | null {
  if (!data || typeof data !== 'object') return null;
  const obj = data as Record<string, unknown>;
  for (const key of keys) {
    if (typeof obj[key] === 'number') return obj[key] as number;
  }
  // Search nested
  for (const val of Object.values(obj)) {
    if (val && typeof val === 'object') {
      const nested = parseUsageValue(val, keys);
      if (nested !== null) return nested;
    }
  }
  return null;
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ position: 'relative', height: '6px', background: 'rgba(255,255,255,0.07)', borderRadius: '3px', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: `${pct}%`,
        background: color,
        borderRadius: '3px',
        transition: 'width 0.6s ease',
        boxShadow: `0 0 6px ${color}88`,
      }} />
    </div>
  );
}


export const WebUsagePanel: React.FC<WebUsagePanelProps> = ({
  connected, usage, limits, onConnect, onDisconnect, connecting
}) => {
  const [showRaw, setShowRaw] = useState(false);

  // Try to parse known fields from the API response
  const sessionUsed = parseUsageValue(usage, ['used', 'tokens_used', 'session_tokens', 'current_usage', 'usage']);
  const sessionMax = parseUsageValue(usage, ['limit', 'max_tokens', 'session_limit', 'total', 'quota']);
  const weeklyUsed = parseUsageValue(limits, ['used', 'tokens_used', 'weekly_tokens']);
  const weeklyMax = parseUsageValue(limits, ['limit', 'max_tokens', 'weekly_limit', 'total', 'quota']);

  const sessionPct = sessionUsed !== null && sessionMax ? Math.min((sessionUsed / sessionMax) * 100, 100) : null;

  const getBarColor = (pct: number | null) => {
    if (pct === null) return '#6366f1';
    if (pct >= 90) return '#ef4444';
    if (pct >= 75) return '#f97316';
    if (pct >= 50) return '#eab308';
    if (pct >= 25) return '#3b82f6';
    return '#22c55e';
  };

  if (!connected) {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '16px',
        padding: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>🌐</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', textTransform: 'uppercase' }}>
              Cuenta Claude Web
            </span>
          </div>
          <div style={{
            padding: '3px 10px', borderRadius: '20px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            fontSize: '11px', color: 'rgba(255,255,255,0.3)',
          }}>
            Desconectado
          </div>
        </div>

        <p style={{ margin: '0 0 14px', fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
          Conecta tu cuenta de Claude.ai para ver el uso de <strong style={{ color: 'rgba(255,255,255,0.65)' }}>todas las fuentes</strong>: web, móvil, extensiones.
        </p>

        <button
          onClick={onConnect}
          disabled={connecting}
          style={{
            width: '100%',
            padding: '11px',
            background: connecting ? 'rgba(99,102,241,0.1)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: connecting ? '1px solid rgba(99,102,241,0.3)' : 'none',
            borderRadius: '12px',
            color: 'white',
            fontWeight: 700,
            fontSize: '14px',
            cursor: connecting ? 'not-allowed' : 'pointer',
            boxShadow: connecting ? 'none' : '0 4px 16px rgba(99,102,241,0.4)',
            transition: 'all 0.2s',
          }}
        >
          {connecting ? '⏳ Abriendo ventana de login...' : '🔑 Conectar cuenta Claude.ai'}
        </button>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(99,102,241,0.06)',
      border: '1px solid rgba(99,102,241,0.2)',
      borderRadius: '16px',
      padding: '20px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: '#22c55e', boxShadow: '0 0 8px #22c55e',
          }} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '2px', textTransform: 'uppercase' }}>
            Cuenta Claude Web
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setShowRaw(!showRaw)}
            style={{
              padding: '4px 10px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: 'rgba(255,255,255,0.4)',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            {showRaw ? 'Ocultar datos' : 'Ver datos raw'}
          </button>
          <button
            onClick={onDisconnect}
            style={{
              padding: '4px 10px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '8px',
              color: '#ef4444',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Desconectar
          </button>
        </div>
      </div>

      {/* Parsed usage if available */}
      {(sessionUsed !== null || weeklyUsed !== null) === true ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sessionUsed !== null && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Sesión (web)</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: getBarColor(sessionPct), fontFamily: 'monospace' }}>
                  {sessionUsed.toLocaleString()}{sessionMax ? ` / ${sessionMax.toLocaleString()}` : ''}
                  {sessionPct !== null ? ` · ${Math.round(sessionPct)}%` : ''}
                </span>
              </div>
              {sessionMax && <MiniBar value={sessionUsed} max={sessionMax} color={getBarColor(sessionPct)} />}
            </div>
          )}
          {weeklyUsed !== null && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Semanal (web)</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#818cf8', fontFamily: 'monospace' }}>
                  {weeklyUsed.toLocaleString()}{weeklyMax ? ` / ${weeklyMax.toLocaleString()}` : ''}
                </span>
              </div>
              {weeklyMax && <MiniBar value={weeklyUsed} max={weeklyMax} color="#6366f1" />}
            </div>
          )}
        </div>
      ) : (
        /* Show raw data as a key-value grid if we can't parse known fields */
        <div>
          <p style={{ margin: '0 0 10px', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
            ✓ Conectado — datos recibidos de Claude.ai
          </p>
          {usage != null && (
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              padding: '12px',
              fontSize: '12px',
              fontFamily: 'monospace',
              color: '#a5b4fc',
              maxHeight: '160px',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
            }}>
              {JSON.stringify(usage as object, null, 2)}
            </div>
          )}
        </div>
      )}

      {/* Raw data toggle */}
      {showRaw && usage != null && (
        <div style={{ marginTop: '12px' }}>
          <p style={{ margin: '0 0 6px', fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>
            RESPUESTA RAW DE LA API:
          </p>
          <div style={{
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '10px',
            padding: '12px',
            fontSize: '11px',
            fontFamily: 'monospace',
            color: 'rgba(165,180,252,0.8)',
            maxHeight: '200px',
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
          }}>
            {JSON.stringify({ usage, limits } as object, null, 2)}
          </div>
        </div>
      )}
    </div>
  );
};
