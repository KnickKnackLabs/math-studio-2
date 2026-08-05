<div align="center">

# mim

**A keyboard-driven visual mathematics instrument.**

Modular source. One portable HTML artifact.

![UI: Svelte](https://img.shields.io/badge/UI-Svelte-ff3e00?style=flat)
![core: TypeScript](https://img.shields.io/badge/core-TypeScript-3178c6?style=flat)
![renderer: Canvas 2D](https://img.shields.io/badge/renderer-Canvas%202D-175e7a?style=flat)
![unit suites: 9](https://img.shields.io/badge/unit%20suites-9-brightgreen?style=flat)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=flat)](LICENSE)

</div>

<br />

## What this is

`mim` is an interactive square-grid instrument for exploring mathematical structure. The first instrument evaluates exact GCD and LCM values, highlights prime results, and supports pointer or keyboard movement.

Svelte owns the interface shell. Plain TypeScript owns state, commands, mathematics, the display pipeline, and Canvas rendering. Vite compiles the maintained source into one direct-open `dist/mim.html` file.

## Start

```bash
mise trust
mise install
bun install --frozen-lockfile
mise run mim:dev

# Build and open the portable artifact.
mise run mim
```

## Architecture

| Owner             | Responsibility                                      |
| ----------------- | --------------------------------------------------- |
| `src/core`        | State, semantic commands, reducer                   |
| `src/instruments` | Exact mathematics and display classifications       |
| `src/input`       | Keyboard and pointer input translated into commands |
| `src/render`      | Canvas pixels from prepared display data            |
| `src/ui`          | Svelte controls and Canvas host                     |
| `scripts`         | Standalone build and aggregate validation           |

## Tasks

| Task                 | Description                                  |
| -------------------- | -------------------------------------------- |
| `mise run bats`      | Run BATS task-boundary tests                 |
| `mise run doctor`    | Check local development setup                |
| `mise run mim`       | Build and open the standalone mim instrument |
| `mise run mim:build` | Build the standalone mim HTML artifact       |
| `mise run mim:dev`   | Run the mim development server               |
| `mise run test`      | Run the complete mim validation path         |

## Validation

```bash
mise run test
codebase lint "$PWD"
readme build --check
git diff --check
```

The aggregate path runs Bun unit tests, Svelte checks, the real standalone build, artifact inspection, and narrow BATS task-boundary tests.

<div align="center">

<sub>
Built as one file, operated as an instrument.
</sub></div>
