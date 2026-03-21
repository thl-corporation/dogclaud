# Claude Usage Tracker

### Nunca mas te quedes sin tokens a mitad de una sesion.

Claude Usage Tracker es una aplicacion de escritorio que monitorea tu consumo de tokens de **Claude Code** en tiempo real. Se conecta directamente con tu cuenta de **claude.ai** para darte datos reales y precisos, no estimaciones.

Sabe exactamente cuanto has usado, cuanto te queda y te avisa antes de que sea demasiado tarde.

---

## Por que existe esto

Si usas Claude Code a diario, conoces el problema: estas en medio de un refactor importante, llevas horas de contexto acumulado, y de repente... **limite alcanzado**. Sin aviso. Sin tiempo para guardar tu progreso mental.

Claude Usage Tracker resuelve esto. Vive en tu bandeja del sistema, vigila tu consumo en silencio, y te alerta con tiempo suficiente para que tomes decisiones inteligentes sobre como usar tus tokens restantes.

---

## Que hace

**Monitoreo dual de datos**
- Datos reales desde la API de claude.ai (sincronizacion cada 30 segundos)
- Estimacion local desde logs JSONL como respaldo
- Los datos web siempre tienen prioridad sobre las estimaciones

**Gauges visuales en tiempo real**
- Sesion actual (ventana de 5 horas) con countdown al reset
- Consumo semanal (ventana de 7 dias) con countdown al reset
- Colores de semaforo que cambian segun tu nivel de uso

**Sistema de alertas inteligente**
- 6 umbrales: 25%, 50%, 75%, 90%, 95%, 100%
- Sonido con 3 pitidos a frecuencias distintas por umbral
- Notificaciones nativas del sistema operativo
- Las alertas NO se disparan al abrir la app — solo despues de sincronizar
- Solo suena la alerta del nivel actual, no todas las anteriores
- Cada alerta se puede silenciar individualmente

**Icono vivo en la bandeja del sistema**
- Cambia de color segun tu consumo (verde -> azul -> amarillo -> naranja -> rojo)
- Tooltip con porcentaje actual y tiempo hasta el reset
- Click izquierdo: abrir/cerrar ventana
- Click derecho: menu con toda la info rapida

**Planificador semanal**
- Define bloques de uso por dia
- Planifica tu semana para no desperdiciar tokens

**3 planes soportados**

| Plan   | Sesion (5h)    | Semanal         |
|--------|----------------|-----------------|
| Pro    | ~7,000 tokens  | ~100,000 tokens |
| Max 5  | ~35,000 tokens | ~500,000 tokens |
| Max 20 | ~140,000 tokens| ~2,000,000 tokens|

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

Compila desde Windows:
```bash
git clone https://github.com/thl-corporation-spa/claude-usage-tracker.git
cd claude-usage-tracker
npm install
npm run dist:win
```

---

## Primeros pasos

1. Abre la app — se minimiza a la bandeja del sistema
2. Click en el icono de la bandeja para abrir la ventana
3. En la pestana **Uso**, presiona **Conectar** para vincular tu cuenta de claude.ai
4. Inicia sesion en la ventana que se abre
5. Listo. Los datos reales empiezan a llegar en segundos

A partir de ahi, la app monitorea en silencio y te alerta cuando cruzas cada umbral.

---

## Stack

- **Electron 28** + **React 18** + **TypeScript**
- **Zustand** para estado
- **Tailwind CSS** con tema oscuro glassmorphism
- **Web Audio API** para alertas sonoras
- **Chokidar** para monitoreo de archivos
- **electron-store** para persistencia de sesion

---

## Desarrollo

```bash
git clone https://github.com/thl-corporation-spa/claude-usage-tracker.git
cd claude-usage-tracker
npm install

# Lanzar app completa
npm run electron:dev

# Solo frontend (Vite dev server)
npm run dev

# Type check
npx tsc --noEmit

# Compilar para distribucion
npm run dist:linux    # AppImage + .deb
npm run dist:mac      # .zip
npm run dist:win      # .exe (requiere Windows)
```

---

## Contribuir

Las contribuciones son bienvenidas. El flujo es:

1. Haz **fork** del repositorio
2. Crea una rama con tu mejora (`git checkout -b mi-mejora`)
3. Haz commit de tus cambios
4. Abre un **Pull Request** describiendo que hiciste y por que

La rama `main` esta protegida. Todos los cambios pasan por revision antes de ser integrados.

---

## Licencia

MIT License — usa, modifica y distribuye libremente.

---

<p align="center">
  <strong>con amor THL Corporation</strong>
</p>
