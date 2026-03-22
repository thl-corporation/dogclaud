<p align="center">
  <img src="assets/dog-emoji-256.png" alt="DogClaud" width="120">
</p>

<h1 align="center">DogClaud</h1>

<p align="center">
  <strong>Your loyal watchdog for Claude Code tokens.</strong><br>
  <sub>Tu guardián fiel para los tokens de Claude Code.</sub>
</p>

<p align="center">
  <a href="https://github.com/thl-corporation/dogclaud/releases"><img src="https://img.shields.io/github/v/release/thl-corporation/dogclaud?style=flat-square&color=6366f1" alt="Release"></a>
  <a href="https://github.com/thl-corporation/dogclaud/blob/main/LICENSE"><img src="https://img.shields.io/github/license/thl-corporation/dogclaud?style=flat-square&color=22c55e" alt="License"></a>
  <a href="https://github.com/thl-corporation/dogclaud/stargazers"><img src="https://img.shields.io/github/stars/thl-corporation/dogclaud?style=flat-square&color=eab308" alt="Stars"></a>
  <a href="https://github.com/thl-corporation/dogclaud/issues"><img src="https://img.shields.io/github/issues/thl-corporation/dogclaud?style=flat-square&color=ef4444" alt="Issues"></a>
  <a href="https://github.com/thl-corporation/dogclaud/releases"><img src="https://img.shields.io/github/downloads/thl-corporation/dogclaud/total?style=flat-square&color=3b82f6" alt="Downloads"></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Electron-28-47848F?style=flat-square&logo=electron" alt="Electron">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Platform-Linux%20%7C%20macOS%20%7C%20Windows-888?style=flat-square" alt="Platform">
</p>

---

## The Problem / El Problema

If you use **Claude Code** daily, you know the feeling: you're deep into a critical refactor, hours of accumulated context, and suddenly — **limit reached**. No warning. No time to save your progress. Your entire flow, gone.

Si usas **Claude Code** a diario, conoces la sensación: estás en medio de un refactor crítico, llevas horas de contexto acumulado, y de repente — **límite alcanzado**. Sin aviso. Sin tiempo para guardar tu progreso. Todo tu flujo, perdido.

## The Solution / La Solución

**DogClaud** is a desktop app that lives in your system tray like a loyal watchdog. It connects directly to your **claude.ai** account, monitors your real token usage in real time, and barks at you before it's too late.

**DogClaud** es una app de escritorio que vive en tu bandeja del sistema como un guardián fiel. Se conecta directamente a tu cuenta de **claude.ai**, monitorea tu consumo real de tokens en tiempo real, y te ladra antes de que sea demasiado tarde.

> **It doesn't estimate. It knows exactly how much you've used and how much you have left.**
>
> **No estima. Sabe exactamente cuánto has usado y cuánto te queda.**

---

## Features / Características

### Real data from claude.ai / Datos reales desde claude.ai
- Direct sync with the claude.ai API every 30 seconds
- Login with your account — data shown only with an active web session
- Without a session, the app shows a neutral state (no fake data)

### Real-time visual gauges / Indicadores visuales en tiempo real
- Current session (5-hour window) with countdown to reset
- Weekly consumption (7-day window) with countdown to reset
- Traffic light colors: green → blue → yellow → orange → red

### Smart alert system / Sistema de alertas inteligente
- 6 thresholds: 25%, 50%, 75%, 90%, 95%, 100%
- 3 beeps with unique frequency per level (1 kHz to 4 kHz)
- Native OS notifications
- **Zero alerts on startup** — only triggers when usage rises and crosses a new threshold
- Individually silenceable per threshold

### Live system tray icon / Ícono dinámico en la bandeja del sistema
- Changes color based on your current consumption level
- Tooltip with percentage and time remaining until reset
- Context menu with full usage summary

### Weekly planner / Planificador semanal
- Define usage blocks per day
- Organize your week to maximize your tokens strategically

### 3 supported plans / 3 planes soportados

| Plan | Session (5 h) | Weekly (7 d) |
|------|---------------|--------------|
| **Pro** | ~7,000 tokens | ~100,000 tokens |
| **Max 5** | ~35,000 tokens | ~500,000 tokens |
| **Max 20** | ~140,000 tokens | ~2,000,000 tokens |

---

## Quick Install / Instalación rápida

### Pre-built binaries / Binarios pre-compilados

Download from [**Releases**](https://github.com/thl-corporation/dogclaud/releases):

**Linux:**
```bash
# AppImage (any distro)
chmod +x DogClaud-1.0.0.AppImage
./DogClaud-1.0.0.AppImage

# Debian / Ubuntu
sudo dpkg -i dogclaud_1.0.0_amd64.deb
```

**macOS:**
Download the `.zip`, extract and drag to Applications.

**Windows:**
Run the `.exe` installer from Releases.

### From source / Desde código fuente

```bash
git clone https://github.com/thl-corporation/dogclaud.git
cd dogclaud
npm install
npm run electron:dev
```

---

## Quick Start / Inicio rápido

1. Open the app — it minimizes to the system tray
2. Click the dog icon to open the window
3. In the **Usage** tab, press **Connect**
4. Login with your claude.ai account
5. Done — real data in seconds

---

## Development / Desarrollo

```bash
git clone https://github.com/thl-corporation/dogclaud.git
cd dogclaud
npm install

npm run electron:dev     # Full app (build + Electron)
npm run dev              # Dev server with hot reload (port 61983)
npx tsc --noEmit         # Quick type check

npm run dist:linux       # AppImage + .deb
npm run dist:mac         # .zip for macOS
npm run dist:win         # .exe installer (must be built on native Windows — see note below)
```

> **Windows build note:** The `dist:win` command requires a native Windows environment. Building on Linux/macOS via Wine is not supported because `electron-builder` uses `rcedit` to modify the `.exe` metadata, which depends on Windows-native DLLs. To build the Windows installer:
>
> 1. Clone the repo on a Windows machine
> 2. Install [Node.js](https://nodejs.org/) (v18+)
> 3. Run `npm install && npm run dist:win`
> 4. The `.exe` installer will be generated in the `release/` folder

---

## Architecture / Arquitectura

```
src/
├── main/index.ts          # Electron main process
├── preload/index.ts       # Secure IPC bridge (contextBridge)
├── renderer/
│   ├── App.tsx            # Main layout + alert logic
│   ├── components/
│   │   ├── gauges/        # SessionGauge, WeeklyGauge (circular SVG)
│   │   ├── alerts/        # AlertManager (threshold buttons)
│   │   ├── settings/      # SettingsPanel
│   │   ├── scheduler/     # WeeklyPlan
│   │   ├── WebUsagePanel  # claude.ai API data
│   │   └── SetupScreen    # Initial setup wizard
│   ├── stores/            # Zustand (usage, alerts, settings)
│   └── hooks/             # useClaudeUsage
├── core/
│   ├── parser/            # Incremental JSONL log reader
│   ├── calculator/        # Usage calculation per time window
│   ├── audio/             # Tone generator (Web Audio API)
│   └── constants.ts       # Limits, thresholds, sound config
└── shared/types.ts        # Shared TypeScript types
```

---

## Contributing / Contribuir

Contributions are welcome! / ¡Las contribuciones son bienvenidas!

1. **Fork** this repository
2. Create a branch from `develop`: `git checkout -b feature/my-improvement develop`
3. Make your changes and verify: `npx tsc --noEmit`
4. Open a **Pull Request** against `develop`

> The `main` branch is protected. All changes go through `develop` via PR.

See [CONTRIBUTING.md](CONTRIBUTING.md) for full guidelines.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Desktop** | Electron 28 |
| **Frontend** | React 18 + TypeScript 5 + Tailwind CSS 3 |
| **State** | Zustand 4 |
| **Audio** | Web Audio API (oscillator + gain) |
| **Monitoring** | Chokidar 3 (file watching) |
| **Persistence** | electron-store 8 |
| **Build** | Vite 5 + vite-plugin-electron |
| **Packaging** | electron-builder (AppImage, deb, zip, exe) |

---

## Security / Seguridad

- No hardcoded API keys, tokens or credentials
- Web session cookies stored locally (electron-store), never transmitted to third parties
- Main process logs don't expose UUIDs, emails, org names or cookie values
- Dev server on non-standard port (61983) to avoid conflicts

---

## Author / Autor

**Eliezer López M.** — [admin@thlcorporation.com](mailto:admin@thlcorporation.com)

Developed by [**THL Corporation**](https://github.com/thl-corporation) from Chile.

---

## License / Licencia

[MIT License](LICENSE) — use, modify and distribute freely.

---

<p align="center">
  <sub>Made with love by <strong>THL Corporation</strong> from Chile</sub>
</p>
