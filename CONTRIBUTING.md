# Contributing to DogClaud / Contribuir a DogClaud

Thank you for your interest in contributing! / Gracias por tu interes en contribuir.

## How to contribute / Como contribuir

1. **Fork** the repository
2. Clone your fork: `git clone https://github.com/YOUR-USER/dogclaud.git`
3. Create a branch from `develop`: `git checkout -b feature/my-improvement develop`
4. Install dependencies: `npm install`
5. Develop with: `npm run electron:dev`
6. Verify types: `npx tsc --noEmit`
7. Commit and push to your fork
8. Open a **Pull Request** against the `develop` branch

> **Important:** PRs should target `develop`, not `main`. The `main` branch is protected and only receives merges from `develop` after review.

## Branch structure / Estructura de ramas

- `main` — Stable, production-ready code. Protected branch.
- `develop` — Active development. All PRs go here.
- `feature/*` — New features (branch from `develop`)
- `fix/*` — Bug fixes (branch from `develop`)

## Rules / Reglas

- UI strings are in **Spanish**
- Use **inline styles** (not Tailwind classes) for components
- Do not upload sensitive data (API keys, credentials, personal UUIDs)
- Verify that it compiles without errors before opening a PR: `npx tsc --noEmit`
- One PR, one purpose. Small, focused PRs are reviewed faster.

## Project structure / Estructura del proyecto

```
src/
  core/          # Shared logic (parser, calculator, audio, constants)
  main/          # Electron main process (index.ts)
  preload/       # IPC bridge (index.ts)
  renderer/      # React UI
    components/  # Visual components
    stores/      # Zustand stores
  shared/        # Shared TypeScript types
```

## Bug reports / Reporte de bugs

Use the [issue templates](https://github.com/thl-corporation-spa/dogclaud/issues/new/choose) to report bugs or suggest features.

---

**Eliezer Lopez M.** — [admin@thlcorporation.com](mailto:admin@thlcorporation.com)
[THL Corporation](https://github.com/thl-corporation-spa) — Chile
