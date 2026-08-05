# Contributing

`mim` turns modular Svelte and TypeScript source into one direct-open HTML mathematics instrument.

## Local setup

```bash
mise trust
mise install
bun install --frozen-lockfile
mise run mim:dev
```

## Design boundaries

Application changes enter through commands in `src/core/`. Input adapters and Svelte controls dispatch commands rather than mutating shared state. Instruments own exact mathematics and display classifications. Renderers receive prepared display data and own pixels only.

Keep the first GCD/LCM instrument concrete. Do not build a generic plugin framework until a second mathematical family proves the shared interface.

## Validation

```bash
mise run test
codebase lint "$PWD"
readme build --check
git diff --check
```

The aggregate test task runs Bun unit tests, Svelte checks, the standalone build and artifact check, and narrow BATS tests of public task boundaries.

`dist/mim.html` is generated and ignored. Never edit it directly.
