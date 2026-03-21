<p align="center">
  <img src="assets/dog-emoji-256.png" alt="Claude Usage Tracker" width="120">
</p>

<h1 align="center">Claude Usage Tracker</h1>

<p align="center">
  <strong>Nunca mas te quedes sin tokens a mitad de una sesion.</strong>
</p>

<p align="center">
  <a href="https://github.com/thl-corporation-spa/claude-usage-tracker/releases"><img src="https://img.shields.io/github/v/release/thl-corporation-spa/claude-usage-tracker?style=flat-square&color=6366f1" alt="Release"></a>
  <a href="https://github.com/thl-corporation-spa/claude-usage-tracker/blob/main/LICENSE"><img src="https://img.shields.io/github/license/thl-corporation-spa/claude-usage-tracker?style=flat-square&color=22c55e" alt="License"></a>
  <a href="https://github.com/thl-corporation-spa/claude-usage-tracker/stargazers"><img src="https://img.shields.io/github/stars/thl-corporation-spa/claude-usage-tracker?style=flat-square&color=eab308" alt="Stars"></a>
  <a href="https://github.com/thl-corporation-spa/claude-usage-tracker/issues"><img src="https://img.shields.io/github/issues/thl-corporation-spa/claude-usage-tracker?style=flat-square&color=ef4444" alt="Issues"></a>
  <a href="https://github.com/thl-corporation-spa/claude-usage-tracker/releases"><img src="https://img.shields.io/github/downloads/thl-corporation-spa/claude-usage-tracker/total?style=flat-square&color=3b82f6" alt="Downloads"></a>
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

Claude Usage Tracker es una app de escritorio que vive en tu bandeja del sistema. Se conecta directamente con tu cuenta de **claude.ai**, monitorea tu consumo real de tokens en silencio, y te alerta con tiempo suficiente para que tomes decisiones inteligentes.

**No estima. Sabe exactamente cuanto has usado y cuanto te queda.**

---

## Funcionalidades

### Datos reales, no estimaciones
- Sincronizacion directa con la API de claude.ai cada 30 segundos
- Estimacion local desde logs JSONL como respaldo automatico
- Los datos web siempre tienen prioridad

### Gauges visuales en tiempo real
- Sesion actual (ventana de 5 horas) con countdown al reset
- Consumo semanal (ventana de 7 dias) con countdown al reset
- Colores de semaforo que cambian en vivo

### Alertas inteligentes
- 6 umbrales configurados: 25%, 50%, 75%, 90%, 95%, 100%
- 3 pitidos con frecuencia unica por nivel (1kHz a 4kHz)
- Notificaciones nativas del sistema operativo
- Solo suena la alerta correcta — no todas las anteriores
- No se disparan al abrir la app, solo despues de sincronizar
- Silenciables individualmente

### Icono vivo en la bandeja
- Cambia de color segun tu consumo
- Tooltip con porcentaje y tiempo al reset
- Menu contextual con info completa
- Click para abrir/cerrar

### Planificador semanal
- Define bloques de uso por dia
- Organiza tu semana para maximizar tokens

### 3 planes soportados

| Plan | Sesion (5h) | Semanal |
|------|-------------|---------|
| **Pro** | ~7,000 tokens | ~100,000 tokens |
| **Max 5** | ~35,000 tokens | ~500,000 tokens |
| **Max 20** | ~140,000 tokens | ~2,000,000 tokens |

---

## Instalacion

### Linux
```bash
# AppImage (cualquier distro)
chmod +x "Claude Usage Tracker-1.0.0.AppImage"
./"Claude Usage Tracker-1.0.0.AppImage"

# Debian / Ubuntu
sudo dpkg -i claude-usage-tracker_1.0.0_amd64.deb
```

### macOS
Descarga el `.zip` desde [Releases](https://github.com/thl-corporation-spa/claude-usage-tracker/releases), descomprime y arrastra a Aplicaciones.

### Windows
```bash
git clone https://github.com/thl-corporation-spa/claude-usage-tracker.git
cd claude-usage-tracker && npm install && npm run dist:win
```

> Descarga los binarios desde la pagina de [**Releases**](https://github.com/thl-corporation-spa/claude-usage-tracker/releases).

---

## Inicio rapido

1. Abre la app — se minimiza a la bandeja del sistema
2. Click en el icono para abrir la ventana
3. Pestana **Uso** → presiona **Conectar**
4. Inicia sesion con tu cuenta de claude.ai
5. Listo. Datos reales en segundos.

---

## Desarrollo

```bash
git clone https://github.com/thl-corporation-spa/claude-usage-tracker.git
cd claude-usage-tracker
npm install

npm run electron:dev     # App completa
npm run dev              # Solo frontend
npx tsc --noEmit         # Type check

npm run dist:linux       # AppImage + .deb
npm run dist:mac         # .zip
npm run dist:win         # .exe (requiere Windows)
```

---

## Contribuir

Las contribuciones son bienvenidas:

1. **Fork** este repositorio
2. Crea una rama (`git checkout -b mi-mejora`)
3. Haz commit de tus cambios
4. Abre un **Pull Request**

> La rama `main` esta protegida. Todos los cambios pasan por revision.

---

## Stack

<table>
  <tr>
    <td><strong>Desktop</strong></td>
    <td>Electron 28</td>
  </tr>
  <tr>
    <td><strong>Frontend</strong></td>
    <td>React 18 + TypeScript + Tailwind CSS</td>
  </tr>
  <tr>
    <td><strong>Estado</strong></td>
    <td>Zustand</td>
  </tr>
  <tr>
    <td><strong>Audio</strong></td>
    <td>Web Audio API</td>
  </tr>
  <tr>
    <td><strong>Monitoreo</strong></td>
    <td>Chokidar (file watching)</td>
  </tr>
  <tr>
    <td><strong>Persistencia</strong></td>
    <td>electron-store</td>
  </tr>
</table>

---

## Licencia

[MIT License](LICENSE) — usa, modifica y distribuye libremente.

---

<p align="center">
  <sub>con amor <strong>THL Corporation</strong> desde Chile</sub>
</p>
