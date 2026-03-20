import React, { useState } from 'react';

interface WebUsagePanelProps {
  connected: boolean;
  usage: unknown;
  limits: unknown;
  onConnect: () => void;
  onDisconnect: () => void;
  connecting: boolean;
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ position: 'relative', height: '8px', background: 'rgba(255,255,255,0.07)', borderRadius: '4px', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: `${pct}%`,
        background: `linear-gradient(90deg, ${color}cc, ${color})`,
        borderRadius: '4px',
        transition: 'width 0.6s ease',
        boxShadow: `0 0 8px ${color}66`,
      }} />
    </div>
  );
}

function getBarColor(pct: number): string {
  if (pct >= 90) return '#ef4444';
  if (pct >= 75) return '#f97316';
  if (pct >= 50) return '#eab308';
  if (pct >= 25) return '#3b82f6';
  return '#22c55e';
}

function formatResetTime(isoStr: string): string {
  try {
    const target = new Date(isoStr);
    const now = Date.now();
    const diff = target.getTime() - now;
    if (diff <= 0) return 'Ya reseteado';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      const remH = hours % 24;
      return `${days}d ${remH}h`;
    }
    return `${hours}h ${minutes}m`;
  } catch {
    return isoStr;
  }
}

interface UsageBlock {
  utilization: number;
  resets_at: string;
}

function parseUsageData(data: Record<string, unknown>): {
  fiveHour: UsageBlock | null;
  sevenDay: UsageBlock | null;
  accountInfo: { email: string | null; organization: string | null; billing_type: string | null; rate_limit_tier: string | null } | null;
  rateLimits: Record<string, unknown> | null;
  convCount: number | null;
} {
  let fiveHour: UsageBlock | null = null;
  let sevenDay: UsageBlock | null = null;

  // Parse the usage endpoint data
  const usage = data.usage as Record<string, unknown> | undefined;
  if (usage) {
    const fh = usage.five_hour as Record<string, unknown> | undefined;
    if (fh && typeof fh.utilization === 'number') {
      fiveHour = { utilization: fh.utilization, resets_at: (fh.resets_at as string) || '' };
    }
    const sd = usage.seven_day as Record<string, unknown> | undefined;
    if (sd && typeof sd.utilization === 'number') {
      sevenDay = { utilization: sd.utilization, resets_at: (sd.resets_at as string) || '' };
    }
  }

  const rawAcc = data.account_info as Record<string, unknown> | undefined;
  const accountInfo = rawAcc ? {
    email: rawAcc.email ? String(rawAcc.email) : null,
    organization: rawAcc.organization ? String(rawAcc.organization) : null,
    billing_type: rawAcc.billing_type ? String(rawAcc.billing_type) : null,
    rate_limit_tier: rawAcc.rate_limit_tier ? String(rawAcc.rate_limit_tier) : null,
  } : null;

  const rateLimits: Record<string, unknown> | null =
    data.rate_limits ? data.rate_limits as Record<string, unknown> : null;
  const convCount: number | null =
    Array.isArray(data.chat_conversations) ? data.chat_conversations.length : null;

  return { fiveHour, sevenDay, accountInfo, rateLimits, convCount };
}


export const WebUsagePanel: React.FC<WebUsagePanelProps> = ({
  connected, usage, limits, onConnect, onDisconnect, connecting
}) => {
  const [showRaw, setShowRaw] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

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
          Conecta tu cuenta de Claude.ai para ver el uso <strong style={{ color: 'rgba(255,255,255,0.65)' }}>real</strong> de todas las fuentes: web, móvil, Claude Code, extensiones.
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

  // Parse the API data
  const apiData = (usage && typeof usage === 'object') ? usage as Record<string, unknown> : {};
  const { fiveHour, sevenDay, accountInfo, rateLimits, convCount } = parseUsageData(apiData);
  const hasRealData = fiveHour !== null || sevenDay !== null;

  const fiveHourColor = fiveHour ? getBarColor(fiveHour.utilization) : '#6366f1';
  const sevenDayColor = sevenDay ? getBarColor(sevenDay.utilization) : '#6366f1';

  const getStatusLabel = (pct: number) => {
    if (pct >= 100) return { text: 'LÍMITE', color: '#ef4444' };
    if (pct >= 90) return { text: 'CRÍTICO', color: '#ef4444' };
    if (pct >= 75) return { text: 'ALERTA', color: '#f97316' };
    if (pct >= 50) return { text: 'PRECAUCIÓN', color: '#eab308' };
    return { text: 'NORMAL', color: '#22c55e' };
  };

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
            Claude Web — Datos Reales
          </span>
          {accountInfo?.billing_type != null && (
            <span style={{
              padding: '2px 8px', borderRadius: '10px',
              background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)',
              fontSize: '10px', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase',
            }}>
              {String(accountInfo.billing_type).replace('stripe_subscription', 'PRO').replace('prepaid', 'API')}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setShowDetails(!showDetails)}
            style={{
              padding: '4px 10px',
              background: showDetails ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${showDetails ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '8px',
              color: showDetails ? '#818cf8' : 'rgba(255,255,255,0.4)',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            {showDetails ? 'Ocultar detalles' : 'Ver detalles'}
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

      {/* Account info bar - collapsible (#6) */}
      {showDetails && accountInfo ? (
        <div style={{
          display: 'flex', gap: '12px', flexWrap: 'wrap',
          marginBottom: '16px',
          padding: '10px 14px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '10px',
          border: '1px solid rgba(255,255,255,0.05)',
          animation: 'fadeIn 0.2s ease-out',
        }}>
          {accountInfo.email != null ? (
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
              {'Correo: ' + String(accountInfo.email)}
            </span>
          ) : null}
          {accountInfo.organization != null ? (
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
              {'Org: ' + String(accountInfo.organization)}
            </span>
          ) : null}
          {accountInfo.rate_limit_tier != null ? (
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
              {'Nivel: ' + String(accountInfo.rate_limit_tier)}
            </span>
          ) : null}
          {convCount !== null ? (
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
              {convCount + ' conversaciones recientes'}
            </span>
          ) : null}
        </div>
      ) : null}

      {/* Main usage gauges */}
      {hasRealData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 5-hour session usage */}
          {fiveHour && (
            <div style={{
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '12px',
              padding: '14px 16px',
              border: `1px solid ${fiveHourColor}22`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                    Sesión (5 horas)
                  </span>
                  <span style={{
                    padding: '2px 6px', borderRadius: '6px',
                    background: `${getStatusLabel(fiveHour.utilization).color}20`,
                    fontSize: '9px', fontWeight: 700,
                    color: getStatusLabel(fiveHour.utilization).color,
                    letterSpacing: '1px',
                  }}>
                    {getStatusLabel(fiveHour.utilization).text}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    fontSize: '20px', fontWeight: 800,
                    color: fiveHourColor,
                    fontFamily: 'monospace',
                  }}>
                    {Math.round(fiveHour.utilization)}%
                  </span>
                </div>
              </div>

              <MiniBar value={fiveHour.utilization} max={100} color={fiveHourColor} />

              {fiveHour.resets_at && (
                <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                    Se resetea en:
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.55)', fontFamily: 'monospace' }}>
                    ⏱ {formatResetTime(fiveHour.resets_at)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 7-day weekly usage */}
          {sevenDay && (
            <div style={{
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '12px',
              padding: '14px 16px',
              border: `1px solid ${sevenDayColor}22`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                    Semanal (7 días)
                  </span>
                  <span style={{
                    padding: '2px 6px', borderRadius: '6px',
                    background: `${getStatusLabel(sevenDay.utilization).color}20`,
                    fontSize: '9px', fontWeight: 700,
                    color: getStatusLabel(sevenDay.utilization).color,
                    letterSpacing: '1px',
                  }}>
                    {getStatusLabel(sevenDay.utilization).text}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    fontSize: '20px', fontWeight: 800,
                    color: sevenDayColor,
                    fontFamily: 'monospace',
                  }}>
                    {Math.round(sevenDay.utilization)}%
                  </span>
                </div>
              </div>

              <MiniBar value={sevenDay.utilization} max={100} color={sevenDayColor} />

              {sevenDay.resets_at && (
                <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                    Se resetea en:
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.55)', fontFamily: 'monospace' }}>
                    ⏱ {formatResetTime(sevenDay.resets_at)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Rate limits info - collapsible (#6) */}
      {showDetails && rateLimits && typeof rateLimits === 'object' && (
        <div style={{ marginTop: '12px' }}>
          <p style={{
            margin: '0 0 8px', fontSize: '11px', fontWeight: 600,
            color: 'rgba(255,255,255,0.35)', letterSpacing: '1.5px', textTransform: 'uppercase',
          }}>
            Límites por modelo
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {(() => {
              const rl = rateLimits as Record<string, unknown>;
              const limiters = rl.tier_model_rate_limiters;
              if (!Array.isArray(limiters)) return null;

              // Group by model
              const models = new Map<string, { limiter: string; value: number; source: string }[]>();
              for (const l of limiters) {
                const item = l as Record<string, unknown>;
                const model = String(item.model_group || 'unknown');
                if (!models.has(model)) models.set(model, []);
                models.get(model)!.push({
                  limiter: String(item.limiter || ''),
                  value: Number(item.value || 0),
                  source: String(item.source || ''),
                });
              }

              return Array.from(models.entries()).map(([model, limits]) => (
                <div key={model} style={{
                  padding: '6px 10px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '8px',
                  fontSize: '10px',
                }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                    {model.replace(/_/g, ' ')}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: '6px' }}>
                    {limits.map(l => `${l.limiter}: ${l.value}`).join(' · ')}
                  </span>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* No data fallback */}
      {!hasRealData && (
        <p style={{ margin: '0', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
          ✓ Conectado — esperando datos de uso...
        </p>
      )}

      {/* Raw JSON toggle button - inside details */}
      {showDetails && (
        <div style={{ marginTop: '12px' }}>
          <button
            onClick={() => setShowRaw(!showRaw)}
            style={{
              padding: '4px 10px',
              background: showRaw ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${showRaw ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '8px',
              color: showRaw ? '#818cf8' : 'rgba(255,255,255,0.4)',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            {showRaw ? 'Ocultar datos crudos' : 'Ver datos crudos'}
          </button>
        </div>
      )}

      {/* Raw JSON content */}
      {showDetails && showRaw && (
        <div style={{ marginTop: '12px' }}>
          <p style={{ margin: '0 0 6px', fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>
            RESPUESTA CRUDA DE LA API:
          </p>
          <div style={{
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '10px',
            padding: '12px',
            fontSize: '11px',
            fontFamily: 'monospace',
            color: 'rgba(165,180,252,0.8)',
            maxHeight: '300px',
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
