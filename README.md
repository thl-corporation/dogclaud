<p align="center">
  <img src="assets/dog-emoji-256.png" alt="DogClaud" width="120">
</p>

<h1 align="center">DogClaud</h1>

<p align="center">
  <strong>Monitorea tu consumo real de tokens de Claude Code. Sin sorpresas.</strong>
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

## El problema

Si usas **Claude Code** a diario, conoces esto: estas en medio de un refactor importante, llevas horas de contexto acumulado, y de repente — **limite alcanzado**. Sin aviso. Sin tiempo para guardar tu progreso mental.

## La solucion

**DogClaud** es una app de escritorio que vive en tu bandeja del sistema. Se conecta directamente con tu cuenta de **claude.ai**, monitorea tu consumo real de tokens en tiempo real, y te alerta con tiempo suficiente para que tomes decisiones inteligentes.

**No estima. Sabe exactamente cuanto has usado y cuanto te queda.**

---

## Funcionalidades

### Datos reales desde claude.ai
- Sincronizacion directa con la API de claude.ai cada 30 segundos
- Requiere login con tu cuenta — los datos se muestran solo con sesion web activa
- Sin sesion, la app muestra estado neutro (sin datos inventados)

### Gauges visuales en tiempo real
- Sesion actual (ventana de 5 horas) con countdown al reset
- Consumo semanal (ventana de 7 dias) con countdown al reset
- Colores de semaforo: verde → azul → amarillo → naranja → rojo

### Sistema de alertas inteligente
- 6 umbrales: 25%, 50%, 75%, 90%, 95%, 100%
- 3 pitidos con frecuencia unica por nivel (1kHz a 4kHz)
- Notificaciones nativas del sistema operativo
- **Cero alertas al iniciar** — solo dispara cuando el uso SUBE y cruza un nuevo umbral
- Silenciables individualmente

### Icono vivo en la bandeja del sistema
- Cambia de color segun tu consumo actual
- Tooltip con porcentaje y tiempo restante al reset
- Menu contextual con resumen completo
- Sin sesion web muestra "Sin sesion web" (sin porcentajes falsos)

### Planificador semanal
- Define bloques de uso por dia
- Organiza tu semana para maximizar tokens

### 3 planes soportados

| Plan | Sesion (5h) | Semanal (7d) |
|------|-------------|--------------|
| **Pro** | ~7,000 tokens | ~100,000 tokens |
| **Max 5** | ~35,000 tokens | ~500,000 tokens |
| **Max 20** | ~140,000 tokens | ~2,000,000 tokens |

---

## Instalacion rapida

### Desde codigo fuente (todas las plataformas)

```bash
git clone https://github.com/thl-corporation-spa/dogclaud.git
cd dogclaud
npm install
npm run electron:dev
```

### Binarios pre-compilados

Descarga desde [**Releases**](https://github.com/thl-corporation-spa/dogclaud/releases):

**Linux:**
```bash
# AppImage (cualquier distro)
chmod +x DogClaud-1.0.0.AppImage
./DogClaud-1.0.0.AppImage

# Debian / Ubuntu
sudo dpkg -i dogclaud_1.0.0_amd64.deb
```

**macOS:**
Descarga el `.zip`, descomprime y arrastra a Aplicaciones.

**Windows:**
```bash
git clone https://github.com/thl-corporation-spa/dogclaud.git
cd dogclaud && npm install && npm run dist:win
```

---

## Inicio rapido

1. Abre la app — se minimiza a la bandeja del sistema
2. Click en el icono del perro para abrir la ventana
3. En la pestana **Uso**, presiona **Conectar**
4. Inicia sesion con tu cuenta de claude.ai
5. Listo — datos reales en segundos

---

## Desarrollo

```bash
git clone https://github.com/thl-corporation-spa/dogclaud.git
cd dogclaud
npm install

npm run electron:dev     # App completa (build + Electron)
npm run dev              # Dev server con hot reload (puerto 61983)
npx tsc --noEmit         # Type check rapido

npm run dist:linux       # Genera AppImage + .deb
npm run dist:mac         # Genera .zip para macOS
npm run dist:win         # Genera .exe (requiere Windows nativo)
```

---

## Arquitectura

```
src/
├── main/index.ts          # Proceso principal Electron (~900 lineas)
├── preload/index.ts       # Bridge seguro (contextBridge)
├── renderer/
│   ├── App.tsx            # Layout principal + logica de alertas
│   ├── components/
│   │   ├── gauges/        # SessionGauge, WeeklyGauge (SVG circular)
│   │   ├── alerts/        # AlertManager (botones con estado)
│   │   ├── settings/      # SettingsPanel
│   │   ├── scheduler/     # WeeklyPlan
│   │   ├── WebUsagePanel  # Datos de claude.ai API
│   │   └── SetupScreen    # Wizard inicial
│   ├── stores/            # Zustand (usage, alerts, settings)
│   └── hooks/             # useClaudeUsage
├── core/
│   ├── parser/            # Lectura incremental de logs JSONL
│   ├── calculator/        # Calculo de uso por ventana temporal
│   ├── audio/             # Generador de tonos (Web Audio API)
│   └── constants.ts       # Limites, umbrales, config de sonido
└── shared/types.ts        # Tipos compartidos (IElectronAPI, etc.)
```

---

## Contribuir

Las contribuciones son bienvenidas:

1. **Fork** este repositorio
2. Crea una rama (`git checkout -b mi-mejora`)
3. Haz commit de tus cambios
4. Abre un **Pull Request**

> La rama `main` esta protegida. Todos los cambios requieren revision via PR.

Consulta [CONTRIBUTING.md](CONTRIBUTING.md) para mas detalles.

---

## Stack

| Capa | Tecnologia |
|------|-----------|
| **Desktop** | Electron 28 |
| **Frontend** | React 18 + TypeScript + Tailwind CSS |
| **Estado** | Zustand |
| **Audio** | Web Audio API (oscillator + gain) |
| **Monitoreo** | Chokidar (file watching) |
| **Persistencia** | electron-store |
| **Build** | Vite + vite-plugin-electron |
| **Empaquetado** | electron-builder (AppImage, deb, zip, exe) |

---

## Seguridad

- Sin API keys, tokens ni credenciales hardcodeadas
- Las cookies de sesion web se almacenan localmente (electron-store), nunca se transmiten a terceros
- Los logs del main process no exponen UUIDs, emails, nombres de org ni valores de cookies
- Dev server en puerto no estandar (61983) para evitar conflictos

---

## Autor

**Eliezer Lopez M.** — [admin@thlcorporation.com](mailto:admin@thlcorporation.com)

---

## Licencia

[MIT License](LICENSE) — usa, modifica y distribuye libremente.

---

<p align="center">
  <sub>con amor <strong>THL Corporation</strong> desde Chile</sub>
</p>
