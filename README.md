# Claude Usage Tracker

Monitoriza tu uso de tokens de Claude Code en tiempo real con alertas visuales y sonoras.

![Claude Usage Tracker](assets/screenshot.png)

## Características

### 📊 Monitoreo en Tiempo Real
- Indicadores de uso para sesión actual (5 horas) y semanal
- Porcentaje de uso con gauges visuales
- Countdown hasta el próximo reset

### 🔔 Sistema de Alertas
- Alertas visuales a los 25%, 50%, 75%, 90%, 95% y 100%
- Alertas sonoras con frecuencias específicas:
  - 25%: 1kHz
  - 50%: 1.25kHz
  - 75%: 2kHz
  - 90%: 2.5kHz
  - 95%: 3kHz
  - 100%: 4kHz
- Posibilidad de silenciar alertas individualmente

### 🎨 Icono Dinámico en Bandeja
- Muestra el porcentaje de uso en el icono de la bandeja
- Colores según nivel de uso (semáforo)
- Actualización en tiempo real

### 📅 Planificador Semanal
- Crear intervalos de uso personalizados
- Definir horarios de trabajo
- Intervalos editables (predeterminado: 5 horas)

### ⚙️ Configuración
- Selección de plan (Pro, Max 5, Max 20)
- Control de volumen de alertas
- Inicio con el sistema operativo
- Inicio minimizado en bandeja

## Instalación

### Windows
1. Descarga el instalador desde `release/`
2. Ejecuta el archivo `.exe`
3. Sigue las instrucciones del instalador

### Linux
```bash
# Usando AppImage
chmod +x Claude-Usage-Tracker-x.x.x.AppImage
./Claude-Usage-Tracker-x.x.x.AppImage

# Usando .deb
sudo dpkg -i claude-usage-tracker_x.x.x_amd64.deb
```

### macOS
1. Descarga el archivo `.dmg`
2. Arrastra la aplicación a tu carpeta de Aplicaciones

## Desarrollo

### Requisitos
- Node.js 18+
- npm o yarn

### Setup
```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/claude-usage-tracker.git
cd claude-usage-tracker

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Generar ejecutable
npm run dist
```

## Uso

1. **Primera ejecución**: La aplicación se minimizará a la bandeja del sistema
2. **Icono en bandeja**: Muestra el % de uso actual con colores
3. **Click izquierdo**: Abre la ventana principal
4. **Click derecho**: Menú contextual con opciones

## Planes de Claude Code

| Plan | Límite Sesión (5h) | Límite Semanal |
|------|---------------------|----------------|
| Pro | ~7,000 tokens | ~100,000 tokens |
| Max 5 | ~35,000 tokens | ~500,000 tokens |
| Max 20 | ~140,000 tokens | ~2,000,000 tokens |

## Notas Técnicas

- La aplicación lee los archivos de logs de Claude Code en `~/.claude/`
- No requiere credenciales - usa la sesión local de Claude Code
- Los datos se procesan localmente

## Contribuir

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcion`)
3. Commit tus cambios (`git commit -m 'Agregar nueva función'`)
4. Push a la rama (`git push origin feature/nueva-funcion`)
5. Abre un Pull Request

## Licencia

MIT License - ver archivo [LICENSE](LICENSE) para más detalles.
