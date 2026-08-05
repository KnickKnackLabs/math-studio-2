<script lang="ts">
  import { onMount } from "svelte";

  import {
    installPerformanceLogApi,
    maybeLogPerformanceSummary,
    performanceSnapshot,
    type PerformanceSnapshot,
  } from "../performance/metrics";

  export let visible: boolean;
  export let windowSeconds: number;

  let mounted = false;
  let snapshot: PerformanceSnapshot = performanceSnapshot(windowSeconds, 0);

  function refresh(): void {
    snapshot = performanceSnapshot(windowSeconds);
    maybeLogPerformanceSummary(snapshot);
  }

  onMount(() => {
    mounted = true;
    installPerformanceLogApi();
    refresh();
    const timer = window.setInterval(refresh, 250);
    return () => window.clearInterval(timer);
  });

  $: if (mounted && snapshot.windowSeconds !== windowSeconds) refresh();

  function duration(value: number): string {
    return value < 10 ? value.toFixed(2) : value.toFixed(1);
  }
</script>

{#if visible}
  <aside class="performance-overlay" aria-label="Render performance">
    <header>
      <strong>render</strong>
      <span>{windowSeconds}s window</span>
      <span class:idle={snapshot.idle}>{snapshot.idle ? "idle" : "live"}</span>
    </header>

    {#if snapshot.latest}
      <div class="performance-latest">
        <span>prepare <strong>{duration(snapshot.latest.prepareMs)} ms</strong></span>
        <span>paint <strong>{duration(snapshot.latest.paintMs)} ms</strong></span>
        <span>total <strong>{duration(snapshot.latest.totalMs)} ms</strong></span>
      </div>
      <div class="performance-summary">
        <span>{snapshot.redrawsPerSecond.toFixed(1)} redraws/s</span>
        <span>min {duration(snapshot.minimumTotalMs)}</span>
        <span>p95 {duration(snapshot.p95TotalMs)}</span>
        <span>max {duration(snapshot.maximumTotalMs)}</span>
        <span>&gt;16.7 {snapshot.overBudgetCount}/{snapshot.sampleCount}</span>
      </div>
      <div class="performance-context">
        <span>{snapshot.latest.context.operation}</span>
        <span>{snapshot.latest.context.xAxis}/{snapshot.latest.context.yAxis}</span>
        <span>{snapshot.latest.context.cellCount.toLocaleString()} cells</span>
      </div>
    {:else}
      <div class="performance-empty">waiting for a redraw</div>
    {/if}
  </aside>
{/if}
