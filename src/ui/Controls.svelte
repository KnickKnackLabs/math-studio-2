<script lang="ts">
  import { AXIS_OPTIONS, type AxisKind } from "../core/axis";
  import type { Dispatch } from "../core/commands";
  import type { MimState } from "../core/state";
  import { defineField, FIELD_PRESETS, fieldPreset } from "../fields/field";
  import { isPrime } from "../instruments/gcd-lcm/math";
  import type {
    ColorMode,
    PrimeRemoval,
    VisualizationConfig,
  } from "../visualization/encoding";

  export let state: MimState;
  export let dispatch: Dispatch;

  let formula = state.field.source;
  let formulaError = "";
  let lastFieldSource = state.field.source;
  let primeCandidate = 2;
  let primeDepth = "all";
  let proximity = 0;
  let visualizationError = "";

  $: selectedPreset = FIELD_PRESETS.some((field) => field.id === state.field.id)
    ? state.field.id
    : "custom";
  $: if (state.field.source !== lastFieldSource) {
    formula = state.field.source;
    formulaError = "";
    lastFieldSource = state.field.source;
  }

  function trackPointer(event: PointerEvent): void {
    if (event.pointerType === "touch") return;
    const position = event.clientY / window.innerHeight;
    const progress = Math.min(1, Math.max(0, (0.5 - position) / (0.5 - 1 / 3)));
    proximity = progress * progress * (3 - 2 * progress);
  }

  function axisKindValue(event: Event): AxisKind {
    return (event.currentTarget as HTMLSelectElement).value as AxisKind;
  }

  function selectField(event: Event): void {
    const id = (event.currentTarget as HTMLSelectElement).value;
    if (id === "custom") return;
    const field = fieldPreset(id);
    formula = field.source;
    formulaError = "";
    lastFieldSource = field.source;
    dispatch({ type: "set-field", field });
  }

  function applyFormula(): void {
    try {
      const field = defineField("custom", "Custom", formula);
      formula = field.source;
      formulaError = "";
      lastFieldSource = field.source;
      dispatch({ type: "set-field", field });
    } catch (error) {
      formulaError = error instanceof Error ? error.message : String(error);
    }
  }

  function updateVisualization(patch: Partial<VisualizationConfig>): void {
    dispatch({
      type: "set-visualization",
      visualization: { ...state.visualization, ...patch },
    });
  }

  function colorModeValue(event: Event): ColorMode {
    return (event.currentTarget as HTMLSelectElement).value as ColorMode;
  }

  function addPrimeRemoval(): void {
    const prime = Math.floor(primeCandidate);
    if (!isPrime(prime)) {
      visualizationError = `${primeCandidate} is not prime`;
      return;
    }
    const depth = primeDepth === "all" ? null : Number(primeDepth);
    const replacement: PrimeRemoval = { depth, prime };
    const existing = state.visualization.primeRemovals.findIndex((item) => item.prime === prime);
    const primeRemovals = existing === -1
      ? [...state.visualization.primeRemovals, replacement]
      : state.visualization.primeRemovals.map((item, index) => index === existing ? replacement : item);
    visualizationError = "";
    updateVisualization({ primeRemovals });
  }

  function removePrimeRemoval(prime: number): void {
    updateVisualization({
      primeRemovals: state.visualization.primeRemovals.filter((item) => item.prime !== prime),
    });
  }
</script>

<svelte:window
  on:pointerleave={() => proximity = 0}
  on:pointermove={trackPointer}
/>

<section
  class="controls"
  aria-label="Instrument controls"
  style={`--controls-proximity: ${proximity}`}
>
  <div class="brand">
    <strong>mim</strong>
    <span>math instrument</span>
  </div>

  <div class="field-control" aria-label="Field">
    <label>
      <span>Field</span>
      <select aria-label="Field preset" value={selectedPreset} on:change={selectField}>
        {#each FIELD_PRESETS as field}
          <option value={field.id}>{field.label}</option>
        {/each}
        <option value="custom">Custom formula</option>
      </select>
    </label>

    <form class="formula-control" on:submit|preventDefault={applyFormula}>
      <label>
        <span>Formula · x y values · xi yi indices</span>
        <div class="formula-row">
          <input
            aria-invalid={formulaError ? "true" : undefined}
            aria-label="Field formula"
            bind:value={formula}
            on:input={() => formulaError = ""}
            spellcheck="false"
            type="text"
          />
          <button type="submit">Apply</button>
        </div>
      </label>
      {#if formulaError}
        <span class="field-error" role="alert">{formulaError}</span>
      {/if}
    </form>
  </div>

  <details class="visualization-control">
    <summary>Visual</summary>
    <div class="visualization-panel">
      <label>
        <span>Color</span>
        <select
          aria-label="Color encoding"
          value={state.visualization.colorMode}
          on:change={(event) => updateVisualization({ colorMode: colorModeValue(event) })}
        >
          <option value="magnitude">Magnitude</option>
          <option value="exact">Exact value</option>
          <option value="bands">Bands</option>
          <option value="modulo">Modulo</option>
          <option value="prime-signature">Prime signature</option>
        </select>
      </label>

      {#if state.visualization.colorMode === "bands"}
        <label>
          <span>Bands</span>
          <input
            max="32"
            min="2"
            type="number"
            value={state.visualization.bandCount}
            on:change={(event) => updateVisualization({
              bandCount: Number((event.currentTarget as HTMLInputElement).value),
            })}
          />
        </label>
      {:else if state.visualization.colorMode === "modulo"}
        <label>
          <span>Modulo</span>
          <input
            max="360"
            min="2"
            type="number"
            value={state.visualization.modulo}
            on:change={(event) => updateVisualization({
              modulo: Number((event.currentTarget as HTMLInputElement).value),
            })}
          />
        </label>
      {/if}

      <label class="check">
        <input
          checked={state.visualization.showEqualValues}
          type="checkbox"
          on:change={() => updateVisualization({
            showEqualValues: !state.visualization.showEqualValues,
          })}
        />
        <span>x = y line</span>
      </label>

      <div class="prime-lens">
        <span>Remove prime powers</span>
        <div class="prime-chips">
          {#each state.visualization.primeRemovals as removal}
            <span class="prime-chip">
              {removal.prime} × {removal.depth === null ? "all" : removal.depth}
              <button
                aria-label={`Remove ${removal.prime} lens`}
                type="button"
                on:click={() => removePrimeRemoval(removal.prime)}
              >×</button>
            </span>
          {/each}
        </div>
        <div class="prime-add">
          <input aria-label="Prime" bind:value={primeCandidate} min="2" type="number" />
          <select aria-label="Powers to remove" bind:value={primeDepth}>
            <option value="all">all powers</option>
            {#each [1, 2, 3, 4, 5, 6] as depth}
              <option value={String(depth)}>{depth} power{depth === 1 ? "" : "s"}</option>
            {/each}
          </select>
          <button type="button" on:click={addPrimeRemoval}>Add</button>
        </div>
        {#if visualizationError}
          <span class="field-error" role="alert">{visualizationError}</span>
        {/if}
      </div>
    </div>
  </details>

  <label class="axis-control">
    <span>X axis</span>
    <select
      aria-label="X axis generator"
      value={state.xAxis}
      on:change={(event) => dispatch({ type: "set-axis", axis: "x", kind: axisKindValue(event) })}
    >
      {#each AXIS_OPTIONS as option}
        <option value={option.kind}>{option.label}</option>
      {/each}
    </select>
  </label>

  <label class="axis-control">
    <span>Y axis</span>
    <select
      aria-label="Y axis generator"
      value={state.yAxis}
      on:change={(event) => dispatch({ type: "set-axis", axis: "y", kind: axisKindValue(event) })}
    >
      {#each AXIS_OPTIONS as option}
        <option value={option.kind}>{option.label}</option>
      {/each}
    </select>
  </label>

  <label class="check">
    <input
      checked={state.showPrimeResults}
      type="checkbox"
      on:change={() => dispatch({ type: "toggle-prime-results" })}
    />
    <span>prime results</span>
  </label>

  <label class="check">
    <input
      checked={state.pinCursor}
      type="checkbox"
      on:change={() => dispatch({ type: "toggle-pin-cursor" })}
    />
    <span>pin cursor</span>
  </label>
</section>
