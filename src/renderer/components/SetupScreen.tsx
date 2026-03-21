import React, { useState } from 'react';

interface SetupScreenProps {
  installed: boolean;
  loggedIn: boolean;
  onRetry: () => void;
}

const Step: React.FC<{
  num: number;
  done: boolean;
  active: boolean;
  title: string;
  children: React.ReactNode;
}> = ({ num, done, active, title, children }) => (
  <div style={{
    display: 'flex',
    gap: '16px',
    padding: '20px',
    background: active
      ? 'rgba(99,102,241,0.1)'
      : done
        ? 'rgba(34,197,94,0.07)'
        : 'rgba(255,255,255,0.03)',
    border: `1px solid ${active ? '#6366f1' : done ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.07)'}`,
    borderRadius: '14px',
    transition: 'all 0.3s ease',
  }}>
    <div style={{
      width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
      background: done ? '#22c55e' : active ? '#6366f1' : 'rgba(255,255,255,0.08)',
      border: `2px solid ${done ? '#22c55e' : active ? '#6366f1' : 'rgba(255,255,255,0.15)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: done ? '16px' : '14px',
      fontWeight: 700,
      color: done || active ? 'white' : 'rgba(255,255,255,0.4)',
      boxShadow: active ? '0 0 16px rgba(99,102,241,0.5)' : done ? '0 0 12px rgba(34,197,94,0.4)' : 'none',
    }}>
      {done ? '✓' : num}
    </div>
    <div style={{ flex: 1 }}>
      <p style={{
        margin: '0 0 6px',
        fontSize: '15px',
        fontWeight: 700,
        color: done ? '#22c55e' : active ? '#a5b4fc' : 'rgba(255,255,255,0.5)',
      }}>
        {title}
      </p>
      {children}
    </div>
  </div>
);

const CodeBlock: React.FC<{ code: string }> = ({ code }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      marginTop: '10px',
      background: 'rgba(0,0,0,0.4)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '10px',
      padding: '10px 14px',
    }}>
      <code style={{ flex: 1, fontSize: '13px', color: '#a5b4fc', fontFamily: 'monospace' }}>
        {code}
      </code>
      <button
        onClick={copy}
        style={{
          padding: '4px 10px',
          background: copied ? 'rgba(34,197,94,0.2)' : 'rgba(99,102,241,0.2)',
          border: `1px solid ${copied ? 'rgba(34,197,94,0.4)' : 'rgba(99,102,241,0.4)'}`,
          borderRadius: '6px',
          color: copied ? '#22c55e' : '#818cf8',
          fontSize: '11px',
          fontWeight: 600,
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        {copied ? '✓ Copiado' : 'Copiar'}
      </button>
    </div>
  );
};

export const SetupScreen: React.FC<SetupScreenProps> = ({ installed, loggedIn, onRetry }) => {
  const openInstall = () => window.electronAPI?.openInstallUrl();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0a0b0f 0%, #111827 60%, #0a0b0f 100%)',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
    }}>

      {/* Logo */}
      <div style={{
        width: '64px', height: '64px', borderRadius: '20px',
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '32px',
        boxShadow: '0 0 40px rgba(99,102,241,0.5)',
        marginBottom: '24px',
      }}>
        ◈
      </div>

      <h1 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: 800, textAlign: 'center' }}>
        DogClaud
      </h1>
      <p style={{ margin: '0 0 40px', fontSize: '14px', color: 'rgba(255,255,255,0.45)', textAlign: 'center', maxWidth: '400px' }}>
        Necesita que Claude Code CLI esté instalado y con sesión iniciada para funcionar.
      </p>

      {/* Warning banner */}
      <div style={{
        width: '100%', maxWidth: '480px',
        padding: '14px 18px',
        background: 'rgba(251,191,36,0.1)',
        border: '1px solid rgba(251,191,36,0.3)',
        borderRadius: '12px',
        marginBottom: '24px',
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <span style={{ fontSize: '20px' }}>⚠️</span>
        <p style={{ margin: 0, fontSize: '13px', color: '#fbbf24', lineHeight: 1.5 }}>
          {!installed
            ? 'Claude Code CLI no está instalado en este sistema.'
            : 'Claude Code CLI está instalado pero no tiene sesión iniciada.'}
        </p>
      </div>

      {/* Steps */}
      <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Step 1: Install */}
        <Step num={1} done={installed} active={!installed} title="Instalar Claude Code CLI">
          {!installed ? (
            <div>
              <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
                Instala la aplicación oficial de Anthropic:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <CodeBlock code="npm install -g @anthropic-ai/claude-code" />
                <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>o</p>
                <button
                  onClick={openInstall}
                  style={{
                    padding: '10px',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
                  }}
                >
                  Descargar desde claude.ai →
                </button>
              </div>
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(34,197,94,0.8)' }}>
              Claude Code CLI detectado correctamente.
            </p>
          )}
        </Step>

        {/* Step 2: Login */}
        <Step num={2} done={loggedIn} active={installed && !loggedIn} title="Iniciar sesión con tu cuenta Pro">
          {installed && !loggedIn ? (
            <div>
              <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
                Abre una terminal y ejecuta:
              </p>
              <CodeBlock code="claude login" />
              <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>
                Iniciará sesión en tu cuenta de Claude Pro en el navegador.
              </p>
            </div>
          ) : loggedIn ? (
            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(34,197,94,0.8)' }}>
              Sesión iniciada correctamente.
            </p>
          ) : (
            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
              Completa el paso anterior primero.
            </p>
          )}
        </Step>

        {/* Step 3: Use Claude Code */}
        <Step num={3} done={false} active={loggedIn} title="Usar Claude Code para generar datos">
          <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
            {loggedIn
              ? 'Todo listo. Una vez que uses Claude Code en algún proyecto, el tracker mostrará tu uso automáticamente.'
              : 'Completa los pasos anteriores para continuar.'}
          </p>
        </Step>
      </div>

      {/* Retry button */}
      <button
        onClick={onRetry}
        style={{
          marginTop: '32px',
          padding: '12px 32px',
          background: installed && loggedIn
            ? 'linear-gradient(135deg, #22c55e, #16a34a)'
            : 'rgba(255,255,255,0.08)',
          border: `1px solid ${installed && loggedIn ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.15)'}`,
          borderRadius: '12px',
          color: 'white',
          fontWeight: 700,
          fontSize: '14px',
          cursor: 'pointer',
          boxShadow: installed && loggedIn ? '0 4px 20px rgba(34,197,94,0.3)' : 'none',
          transition: 'all 0.2s',
        }}
      >
        {installed && loggedIn ? '✓ Continuar a la aplicación' : '↺ Verificar nuevamente'}
      </button>

      <p style={{ marginTop: '16px', fontSize: '11px', color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
        Esta app solo rastrea uso de Claude Code CLI · No requiere credenciales adicionales
      </p>
    </div>
  );
};
