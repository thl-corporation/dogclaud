# Contribuir a DogClaud

Gracias por tu interes en contribuir. Aqui te explicamos como hacerlo.

## Como contribuir

1. **Fork** el repositorio
2. Clona tu fork: `git clone https://github.com/TU-USUARIO/dogclaud.git`
3. Crea una rama: `git checkout -b mi-mejora`
4. Instala dependencias: `npm install`
5. Desarrolla con: `npm run electron:dev`
6. Verifica tipos: `npx tsc --noEmit`
7. Commit y push a tu fork
8. Abre un **Pull Request** contra `main`

## Reglas

- Los strings de UI van en **espanol**
- Usa **inline styles** (no clases Tailwind) para componentes
- No subas datos sensibles (API keys, credenciales, UUIDs personales)
- Verifica que compile sin errores antes de abrir PR
- Un PR, un proposito. PRs pequenos y enfocados se revisan mas rapido.

## Estructura del proyecto

```
src/
  core/          # Logica compartida (parser, calculadora, audio, constantes)
  main/          # Proceso principal Electron (index.ts)
  preload/       # Bridge IPC (index.ts)
  renderer/      # React UI
    components/  # Componentes visuales
    stores/      # Zustand stores
  shared/        # Tipos TypeScript compartidos
```

## Reporte de bugs

Usa los [issue templates](https://github.com/thl-corporation-spa/dogclaud/issues/new/choose) para reportar bugs o sugerir funcionalidades.
