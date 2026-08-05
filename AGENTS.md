# mim

`mim` is a keyboard-driven visual mathematics instrument. Its maintained source is modular TypeScript and Svelte; its portable product is one generated HTML file.

## Structure

- `src/core/` owns application state, semantic commands, and the reducer.
- `src/instruments/` owns mathematical behavior and renderer-facing classifications.
- `src/input/` translates browser input into semantic commands.
- `src/render/` draws prepared display data and does not own mathematics.
- `src/ui/` contains the Svelte interface shell.
- `scripts/` owns aggregate validation and the standalone build contract.

Only semantic commands change application state. Keep Svelte out of the mathematical core. Keep instrument-specific concepts near their instrument instead of adding catch-all `types`, `schemas`, or `utils` modules.

The current GCD/LCM instrument is the first concrete consumer, not proof that every concept needs a plugin interface. Add abstractions only when another real instrument establishes the shared contract.

## Workflow

```bash
mise install
bun install --frozen-lockfile
mise run mim:dev
mise run test
mise run mim:build
mise run mim
```

`dist/mim.html` is generated. Do not edit it directly or commit it. Validate behavior in source and validate the generated artifact through the public build path.

Before committing, run `mise run test`, `codebase lint "$PWD"`, `readme build --check`, and `git diff --check`.
