# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Claude Usage Tracker es una aplicación desktop Electron que monitorea el uso de tokens de Claude Code en tiempo real. Lee archivos JSONL de `~/.claude/projects/`, calcula el consumo de tokens en ventanas de sesión (5h) y semanal (7d) contra límites del plan (Pro/Max5/Max20), y muestra gauges de uso con alertas visuales/audio en umbrales configurables. UI escrita en español.

## Commands

- `npm run dev` — Servidor dev Vite (solo renderer, sin Electron shell)
- `npm run electron:dev` — Compilar y lanzar app Electron completa
- `npm run build` — TypeScript check + Vite production build
- `npm run dist:linux` — Build + empaquetado .AppImage y .deb (output en `release/`)
- `npm run dist:win` / `dist:mac` — Empaquetado para otras plataformas
- `npx tsc --noEmit` — Type check rápido sin build

**Nota:** Si `dist/` o `release/` tienen archivos propiedad de root (de builds previos con sudo), hay que limpiarlos con `sudo rm -rf dist release` antes de rebuilds.

## Architecture

### Modelo de tres procesos Electron

**Main process** (`src/main/index.ts`) — Archivo único (~880 líneas). Gestiona BrowserWindow, system tray con icono dinámico, file watching (chokidar en `~/.claude/projects/**/*.jsonl`), todos los handlers IPC, persistencia de sesión web con cookies (electron-store), notificaciones nativas del SO, y orquestación del cálculo de uso.

**Preload** (`src/preload/index.ts`) — Expone `window.electronAPI` via contextBridge. Toda comunicación renderer↔main pasa por esta API tipada (interfaz `IElectronAPI` en `src/shared/types.ts`).

**Renderer** (`src/renderer/`) — React 18 + Tailwind CSS. Entry en `main.tsx`, layout principal en `App.tsx` que orquesta todo: tabs, gauges, alertas con sonido, web session, y configuración.

### Core logic (`src/core/`)

Módulos compartidos entre procesos:

- `parser/jsonlParser.ts` — Lectura incremental de logs JSONL (rastrea posición de archivo para no re-leer). Extrae tokens de `message.usage`, `usage` directo, o campos `input_tokens`/`output_tokens`.
- `calculator/usageCalculator.ts` — Cálculo de totales por sesión/semana, tiempos de reset, colores por porcentaje, formateo de countdowns.
- `audio/toneGenerator.ts` — Genera tonos con Web Audio API (oscillator + gain). Frecuencias distintas por umbral de alerta.
- `constants.ts` — Límites de planes, umbrales de alerta con frecuencias/colores, parámetros de sonido, nombres de días en español.

### Renderer structure

- `stores/` — Zustand: `usageStore` (datos de uso), `alertStore` (estado de alertas), `settingsStore` (configuración)
- `hooks/useClaudeUsage.ts` — Hook legacy de polling (no se usa actualmente; la lógica de alertas+sonido está en App.tsx directamente)
- `components/gauges/` — SessionGauge y WeeklyGauge (SVG circular con gradientes y glow)
- `components/alerts/AlertManager.tsx` — Botones de umbrales con estado triggered/silenced
- `components/settings/SettingsPanel.tsx` — Selección de plan, toggles, volumen
- `components/scheduler/WeeklyPlan.tsx` — Planificador semanal con intervalos editables
- `components/SetupScreen.tsx` — Wizard de setup (detecta si Claude CLI está instalado y con sesión)
- `components/WebUsagePanel.tsx` — Datos reales de claude.ai API con detalles colapsables

### Flujo de datos

1. Chokidar detecta cambios en `.jsonl` → main parsea solo bytes nuevos (incremental)
2. `usageCalculator` agrega tokens en ventanas de sesión (5h) y semanal (7d) → main emite `usage-update` al renderer
3. App.tsx actualiza Zustand stores → React re-renderiza gauges y chequea umbrales de alerta → `playTone` si se cruza un umbral
4. Si hay sesión web activa (claude.ai API via `/api/bootstrap` + `/api/organizations/{id}/usage`), los datos web tienen precedencia sobre estimaciones JSONL
5. Main process mantiene sesión web en partición separada (`persist:claude-web`) con cookies persistidas en electron-store

### IPC channels

- **invoke (renderer→main):** `check-setup`, `get-usage-data`, `get-settings`, `save-settings`, `get-user-info`, `check-web-session`, `open-web-login`, `get-web-usage`, `disconnect-web`
- **send (renderer→main):** `update-tray-icon`, `update-tray-tooltip`, `minimize-to-tray`, `show-window`, `quit-app`, `silence-alert`
- **push (main→renderer):** `usage-update`, `show-alert`, `web-session-changed`, `web-usage-update`

## Estilo de UI

- Inline styles (no clases Tailwind) para todos los componentes. Tema oscuro con glassmorphism (`rgba(255,255,255,0.04)` backgrounds, bordes `rgba(255,255,255,0.07)`, border-radius 16px).
- Paleta de semáforo: verde `#22c55e` → azul `#3b82f6` → amarillo `#eab308` → naranja `#f97316` → rojo `#ef4444`.
- Animaciones CSS definidas en `index.css`: `pulse`, `blink`, `fadeIn`, `spin`.
- Todos los strings de UI en español.

## Build & Config

- Vite + vite-plugin-electron para build dual (renderer → `dist/`, main+preload → `dist-electron/`)
- Path aliases: `@/` → `src/`, `@shared/` → `src/shared/`
- TypeScript strict con `noUnusedLocals` y `noUnusedParameters`
- electron-builder config en `package.json` bajo `"build"`; output en `release/`
- Tipos compartidos en `src/shared/types.ts` (incluye `IElectronAPI`, `PlanType`, `UsageData`, `TokenEvent`, `AppSettings`)
