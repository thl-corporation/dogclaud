<p align="center">
  <img src="assets/dog-emoji-256.png" alt="DogClaud" width="120">
</p>

<h1 align="center">DogClaud</h1>

<p align="center">
  <strong>Monitor your Claude Code token usage in real time. No surprises.</strong><br>
  <sub>Monitorea tu consumo real de tokens de Claude Code. Sin sorpresas.</sub>
</p>

<p align="center">
  <a href="https://github.com/thl-corporation-spa/dogclaud/releases"><img src="https://img.shields.io/github/v/release/thl-corporation-spa/dogclaud?style=flat-square&color=6366f1" alt="Release"></a>
  <a href="https://github.com/thl-corporation-spa/dogclaud/blob/main/LICENSE"><img src="https://img.shields.io/github/license/thl-corporation-spa/dogclaud?style=flat-square&color=22c55e" alt="License"></a>
  <a href="https://github.com/thl-corporation-spa/dogclaud/stargazers"><img src="https://img.shields.io/github/stars/thl-corporation-spa/dogclaud?style=flat-square&color=eab308" alt="Stars"></a>
  <a href="https://github.com/thl-corporation-spa/dogclaud/issues"><img src="https://img.shields.io/github/issues/thl-corporation-spa/dogclaud?style=flat-square&color=ef4444" alt="Issues"></a>
  <a href="https://github.com/thl-corporation-spa/dogclaud/releases"><img src="https://img.shields.io/github/downloads/thl-corporation-spa/dogclaud/total?style=flat-square&color=3b82f6" alt="Downloads"></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Electron-28-47848F?style=flat-square&logo=electron" alt="Electron">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Platform-Linux%20%7C%20macOS%20%7C%20Windows-888?style=flat-square" alt="Platform">
</p>

---

## The Problem / El Problema

If you use **Claude Code** daily, you know this: you're in the middle of an important refactor, hours of accumulated context, and suddenly — **limit reached**. No warning. No time to save your mental progress.

Si usas **Claude Code** a diario, conoces esto: estas en medio de un refactor importante, llevas horas de contexto acumulado, y de repente — **limite alcanzado**. Sin aviso.

## The Solution / La Solucion

**DogClaud** is a desktop app that lives in your system tray. It connects directly to your **claude.ai** account, monitors your real token usage in real time, and alerts you with enough time to make smart decisions.

**It doesn't estimate. It knows exactly how much you've used and how much you have left.**

---

## Features / Funcionalidades

### Real data from claude.ai / Datos reales desde claude.ai
- Direct sync with the claude.ai API every 30 seconds
- Login with your account — data shown only with an active web session
- Without a session, the app shows a neutral state (no fake data)

### Real-time visual gauges / Gauges visuales en tiempo real
- Current session (5-hour window) with countdown to reset
- Weekly consumption (7-day window) with countdown to reset
- Traffic light colors: green → blue → yellow → orange → red

### Smart alert system / Sistema de alertas inteligente
- 6 thresholds: 25%, 50%, 75%, 90%, 95%, 100%
- 3 beeps with unique frequency per level (1kHz to 4kHz)
- Native OS notifications
- **Zero alerts on startup** — only triggers when usage RISES and crosses a new threshold
- Individually silenceable

### Live system tray icon / Icono vivo en la bandeja del sistema
- Changes color based on your current consumption
- Tooltip with percentage and time remaining until reset
- Context menu with full summary

### Weekly planner / Planificador semanal
- Define usage blocks per day
- Organize your week to maximize tokens

### 3 supported plans / 3 planes soportados

| Plan | Session (5h) | Weekly (7d) |
|------|-------------|--------------|
| **Pro** | ~7,000 tokens | ~100,000 tokens |
| **Max 5** | ~35,000 tokens | ~500,000 tokens |
| **Max 20** | ~140,000 tokens | ~2,000,000 tokens |

---

## Quick Install / Instalacion rapida

### Pre-built binaries / Binarios pre-compilados

Download from [**Releases**](https://github.com/thl-corporation-spa/dogclaud/releases):

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

### From source / Desde codigo fuente

```bash
git clone https://github.com/thl-corporation-spa/dogclaud.git
cd dogclaud
npm install
npm run electron:dev
```

---

## Quick Start / Inicio rapido

1. Open the app — it minimizes to the system tray
2. Click the dog icon to open the window
3. In the **Usage** tab, press **Connect**
4. Login with your claude.ai account
5. Done — real data in seconds

---

## Development / Desarrollo

```bash
git clone https://github.com/thl-corporation-spa/dogclaud.git
cd dogclaud
npm install

npm run electron:dev     # Full app (build + Electron)
npm run dev              # Dev server with hot reload (port 61983)
npx tsc --noEmit         # Quick type check

npm run dist:linux       # AppImage + .deb
npm run dist:mac         # .zip for macOS
npm run dist:win         # .exe installer (requires native Windows)
```

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

Contributions are welcome! / Las contribuciones son bienvenidas!

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

**Eliezer Lopez M.** — [admin@thlcorporation.com](mailto:admin@thlcorporation.com)

Developed by [**THL Corporation**](https://github.com/thl-corporation-spa) from Chile.

---

## License / Licencia

[MIT License](LICENSE) — use, modify and distribute freely.

---

<p align="center">
  <sub>Made with love by <strong>THL Corporation</strong> from Chile</sub>
</p>
