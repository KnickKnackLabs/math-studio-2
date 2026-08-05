<script lang="ts">
  import { axisValueAt } from "./core/axis";
  import type { Command } from "./core/commands";
  import { reduceState } from "./core/reducer";
  import { createInitialState } from "./core/state";
  import { evaluateField } from "./fields/field";
  import { commandForKey } from "./input/keyboard";
  import { visibleGridExtent, type VisibleGridExtent } from "./render/layout";
  import Controls from "./ui/Controls.svelte";
  import { applyPrimeLens } from "./visualization/encoding";
  import HelpOverlay from "./ui/HelpOverlay.svelte";
  import LatticeCanvas from "./ui/LatticeCanvas.svelte";
  import PerformanceOverlay from "./ui/PerformanceOverlay.svelte";

  let state = createInitialState();
  let visibleExtent: VisibleGridExtent = visibleGridExtent(1, 1, 1);

  function dispatch(command: Command): void {
    const previousCursor = state.cursor;
    const next = reduceState(state, command);
    if (
      !next.cursor
      || (command.type !== "move-cursor" && command.type !== "repeat-motion")
      || visibleExtent.columns === 0
      || visibleExtent.rows === 0
    ) {
      state = next;
      return;
    }

    const dx = next.pinCursor && previousCursor
      ? next.cursor.x - previousCursor.x
      : next.cursor.x < visibleExtent.minX
        ? next.cursor.x - visibleExtent.minX
        : next.cursor.x > visibleExtent.maxX
          ? next.cursor.x - visibleExtent.maxX
          : 0;
    const dy = next.pinCursor && previousCursor
      ? next.cursor.y - previousCursor.y
      : next.cursor.y < visibleExtent.minY
        ? next.cursor.y - visibleExtent.minY
        : next.cursor.y > visibleExtent.maxY
          ? next.cursor.y - visibleExtent.maxY
          : 0;
    state = dx === 0 && dy === 0
      ? next
      : reduceState(next, { type: "pan-view", dx, dy });
  }

  function handleGlobalHelpKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented || (event.key !== "?" && event.key !== "Escape")) return;
    const command = commandForKey(event.key);
    if (!command) return;
    event.preventDefault();
    dispatch(command);
  }

  $: selectedX = state.cursor ? axisValueAt(state.xAxis, state.cursor.x) : null;
  $: selectedY = state.cursor ? axisValueAt(state.yAxis, state.cursor.y) : null;
  $: selectedValue = !state.cursor || selectedX === null || selectedY === null
    ? null
    : evaluateField(state.field, {
        x: selectedX,
        xi: state.cursor.x,
        y: selectedY,
        yi: state.cursor.y,
      });
  $: selectedLens = selectedValue === null
    ? null
    : applyPrimeLens(selectedValue, state.visualization.primeRemovals);
  $: recordedMotion = state.motionStart && state.motionEnd
    ? {
        dx: state.motionEnd.x - state.motionStart.x,
        dy: state.motionEnd.y - state.motionStart.y,
        steps: state.recordedMotion.length,
      }
    : null;
</script>

<svelte:window on:keydown={handleGlobalHelpKeydown} />

<main>
  <Controls {state} {dispatch} />

  <div class="instrument">
    <LatticeCanvas {state} {dispatch} bind:visibleExtent />
  </div>

  <PerformanceOverlay
    visible={state.performanceVisible}
    windowSeconds={state.performanceWindowSeconds}
  />

  <aside class="camera-readout" aria-label="Camera status">
    <span>zoom <strong>1/{state.zoomDenominator}</strong></span>
    <span>M <strong>{visibleExtent.columns}</strong></span>
    <span>N <strong>{visibleExtent.rows}</strong></span>
  </aside>

  <aside class="readout" aria-live="polite">
    {#if state.motionStart && !state.motionEnd}
      <span>recording from ({state.motionStart.x}, {state.motionStart.y})</span>
    {:else if recordedMotion}
      <span>{recordedMotion.steps} motions · Δ({recordedMotion.dx}, {recordedMotion.dy})</span>
    {/if}
    {#if state.cursor && selectedX !== null && selectedY !== null && selectedValue !== null}
      <strong>{state.field.label}({selectedX}, {selectedY})</strong>
      <span>
        {state.field.source} = {selectedValue}
        {#if selectedLens && selectedLens.value !== selectedValue}
          · lens → {selectedLens.value}
        {/if}
      </span>
    {:else}
      <span>point at the lattice</span>
    {/if}
  </aside>

  {#if state.helpVisible}
    <HelpOverlay {dispatch} />
  {/if}
</main>
