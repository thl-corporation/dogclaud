# Claude Usage Tracker

Monitoriza tu uso de tokens de Claude Code en tiempo real con alertas visuales y sonoras. Sincroniza directamente con tu cuenta de claude.ai para obtener datos reales de consumo.

![Claude Usage Tracker](assets/screenshot.png)

## Caracteristicas

### Monitoreo en Tiempo Real
- Indicadores de uso para sesion actual (5 horas) y semanal (7 dias)
- Porcentaje de uso con gauges visuales circulares (SVG con gradientes y glow)
- Countdown hasta el proximo reset
- Fuente de datos dual: estimacion desde logs JSONL locales o datos reales de claude.ai API

### Sincronizacion Web con claude.ai
- Inicio de sesion directo con tu cuenta de claude.ai
- Datos de uso reales via API (`/api/organizations/{id}/usage`)
- Los datos web tienen precedencia sobre estimaciones locales
- Persistencia de sesion con cookies (sobrevive reinicios)
- Sincronizacion automatica cada 30 segundos
- Deteccion automatica de organizacion y plan

### Sistema de Alertas Inteligente
- Alertas visuales y sonoras en umbrales: 25%, 50%, 75%, 90%, 95% y 100%
- Frecuencias de sonido especificas por umbral (1kHz a 4kHz)
- 3 pitidos por alerta con tonos sinusoidales (Web Audio API)
- **Las alertas NO se disparan al iniciar la aplicacion** — solo se activan despues de la sincronizacion con la cuenta
- Al sincronizar, solo se dispara la alerta correspondiente al porcentaje actual (no todas las anteriores)
- Posibilidad de silenciar alertas individualmente
- Notificaciones nativas del sistema operativo

### Icono Dinamico en Bandeja del Sistema
- Icono con emoji de perro que cambia de color segun el nivel de uso
- Semaforo de colores: verde -> azul -> amarillo -> naranja -> rojo
- Tooltip con porcentaje y tiempo de reset
- Menu contextual con info de sesion, plan y acciones rapidas
- Click izquierdo para mostrar/ocultar ventana

### Planificador Semanal
- Crear intervalos de uso personalizados
- Definir horarios de trabajo por dia
- Intervalos editables (predeterminado: 5 horas)

### Configuracion
- Seleccion de plan (Pro, Max 5, Max 20)
- Control de volumen de alertas (0% a 100%)
- Inicio con el sistema operativo
- Inicio minimizado en bandeja
- Toast de confirmacion al guardar

## Instalacion

### Linux
```bash
# Usando AppImage
chmod +x "Claude Usage Tracker-1.0.0.AppImage"
./"Claude Usage Tracker-1.0.0.AppImage"

# Usando .deb (Debian/Ubuntu)
sudo dpkg -i claude-usage-tracker_1.0.0_amd64.deb
```

### macOS
1. Descarga `Claude Usage Tracker-1.0.0-mac.zip` desde `release/`
2. Descomprime y arrastra la aplicacion a tu carpeta de Aplicaciones

### Windows
1. Compila desde Windows con `npm run dist:win` (requiere entorno Windows nativo)
2. Ejecuta el instalador `.exe` generado en `release/`

## Desarrollo

### Requisitos
- Node.js 18+
- npm

### Setup
```bash
# Clonar el repositorio
git clone https://github.com/eliezer/claude-usage-tracker.git
cd claude-usage-tracker

# Instalar dependencias
npm install

# Ejecutar en desarrollo (Electron completo)
npm run electron:dev

# Solo renderer (Vite dev server, sin shell Electron)
npm run dev

# Type check rapido
npx tsc --noEmit
```

### Compilar para distribucion
```bash
# Linux (AppImage + .deb)
npm run dist:linux

# macOS (zip)
npm run dist:mac

# Windows (nsis installer - requiere Windows o Wine funcional)
npm run dist:win

# Todas las plataformas
npm run dist
```

> **Nota:** Si `dist/` o `release/` tienen archivos de builds previos con root, limpiar con `sudo rm -rf dist release` antes de rebuilds.

## Uso

1. **Primera ejecucion**: La aplicacion se minimiza a la bandeja del sistema
2. **Conectar cuenta**: En la pestana "Uso", conecta tu cuenta de claude.ai para datos reales
3. **Icono en bandeja**: Muestra el porcentaje de uso con colores de semaforo
4. **Click izquierdo**: Abre/oculta la ventana principal
5. **Click derecho**: Menu contextual con info y opciones
6. **Alertas**: Suenan automaticamente al cruzar cada umbral (solo despues de sincronizar)

## Planes de Claude Code

| Plan   | Limite Sesion (5h)  | Limite Semanal      |
|--------|---------------------|---------------------|
| Pro    | ~7,000 tokens       | ~100,000 tokens     |
| Max 5  | ~35,000 tokens      | ~500,000 tokens     |
| Max 20 | ~140,000 tokens     | ~2,000,000 tokens   |

## Arquitectura

### Modelo de tres procesos Electron

- **Main process** (`src/main/index.ts`) — Ventana, tray, file watching (chokidar), IPC handlers, sesion web con cookies, notificaciones nativas, calculo de uso
- **Preload** (`src/preload/index.ts`) — Expone `window.electronAPI` via contextBridge
- **Renderer** (`src/renderer/`) — React 18 + Tailwind CSS + Zustand stores

### Flujo de datos

```
Archivos JSONL (~/.claude/projects/)
  -> Chokidar detecta cambios
  -> Parser incremental
  -> Calculo de uso
  -> IPC a renderer
  -> React actualiza gauges + alertas

API Web (claude.ai) cada 30s
  -> /api/bootstrap (auth + org)
  -> /api/organizations/{id}/usage (datos reales)
  -> Precedencia sobre datos JSONL
  -> Actualiza tray + gauges + alertas
```

## Stack Tecnologico

- **Frontend:** React 18, TypeScript, Tailwind CSS
- **Desktop:** Electron 28 con Vite
- **State:** Zustand
- **File Watching:** Chokidar
- **Persistencia:** electron-store (settings + cookies web)
- **Audio:** Web Audio API (oscillator + gain)
- **Build:** Vite + vite-plugin-electron + electron-builder

## Licencia

MIT License - ver archivo [LICENSE](LICENSE) para mas detalles.
