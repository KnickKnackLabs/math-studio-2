<script lang="ts">
  import { onMount } from "svelte";

  import { axisValueAt } from "../core/axis";
  import type { Dispatch } from "../core/commands";
  import type { MimState } from "../core/state";
  import {
    createKeySequenceState,
    interpretKey,
    movementForKey,
    movementForKeys,
  } from "../input/keyboard";
  import { cellForPoint } from "../input/pointer";
  import { wheelZoomDenominator } from "../input/wheelZoom";
  import { buildFrame } from "../instruments/gcd-lcm/frame";
  import { recordRender } from "../performance/metrics";
  import { renderFrame } from "../render/canvas/render";
  import {
    squareGridAtScale,
    visibleGridExtent,
    type VisibleGridExtent,
  } from "../render/layout";

  export let state: MimState;
  export let dispatch: Dispatch;
  export let visibleExtent: VisibleGridExtent = visibleGridExtent(1, 1, 1);

  let canvas: HTMLCanvasElement;
  let cssHeight = 1;
  let cssWidth = 1;
  let dragLastX = 0;
  let dragLastY = 0;
  let dragPointerId: number | null = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let heldDelay: number | null = null;
  let heldInterval: number | null = null;
  const heldMovementKeys = new Set<string>();
  let keySequence = createKeySequenceState();
  let pendingWheelDelta = 0;
  let pendingWheelX = 0;
  let pendingWheelY = 0;
  let panning = false;
  let pointerHidden = false;
  let pointerIdleTimer: number | null = null;
  let pixelRatio = 1;
  let wheelFrame: number | null = null;

  const HELD_MOVEMENT_DELAY_MS = 180;
  const HELD_MOVEMENT_INTERVAL_MS = 55;
  const POINTER_IDLE_MS = 1000;

  $: visibleExtent = visibleGridExtent(
    cssWidth,
    cssHeight,
    state.zoomDenominator,
    state.viewX,
    state.viewY,
  );
  $: if (canvas && cssWidth > 1 && cssHeight > 1) {
    const prepareStarted = performance.now();
    const frame = buildFrame(state, visibleExtent);
    const prepareEnded = performance.now();
    try {
      renderFrame(canvas, frame, { cssHeight, cssWidth, pixelRatio });
    } finally {
      const paintEnded = performance.now();
      recordRender({
        context: {
          cellCount: frame.cells.length,
          columns: frame.columns,
          cursor: state.cursor ? { ...state.cursor } : null,
          operation: state.field.id,
          pinCursor: state.pinCursor,
          rows: frame.rows,
          showPrimeResults: state.showPrimeResults,
          viewX: frame.viewX,
          viewY: frame.viewY,
          xAxis: state.xAxis,
          yAxis: state.yAxis,
          zoomDenominator: frame.zoomDenominator,
        },
        paintMs: paintEnded - prepareEnded,
        prepareMs: prepareEnded - prepareStarted,
        sampledAt: paintEnded,
        totalMs: paintEnded - prepareStarted,
        wallTime: Date.now(),
      });
    }
  }

  onMount(() => {
    const observer = new ResizeObserver(([entry]) => {
      cssWidth = entry.contentRect.width;
      cssHeight = entry.contentRect.height;
      pixelRatio = window.devicePixelRatio || 1;
    });
    observer.observe(canvas);
    canvas.focus();
    return () => {
      observer.disconnect();
      clearHeldMovement();
      clearPointerIdleTimer();
      if (wheelFrame !== null) cancelAnimationFrame(wheelFrame);
    };
  });

  function dispatchHeldMovement(): void {
    const [dx, dy] = movementForKeys(heldMovementKeys);
    if (dx !== 0 || dy !== 0) dispatch({ type: "move-cursor", dx, dy });
  }

  function scheduleHeldMovement(): void {
    if (heldDelay !== null || heldInterval !== null) return;
    heldDelay = window.setTimeout(() => {
      heldDelay = null;
      dispatchHeldMovement();
      heldInterval = window.setInterval(
        dispatchHeldMovement,
        HELD_MOVEMENT_INTERVAL_MS,
      );
    }, HELD_MOVEMENT_DELAY_MS);
  }

  function clearHeldMovement(): void {
    if (heldDelay !== null) window.clearTimeout(heldDelay);
    if (heldInterval !== null) window.clearInterval(heldInterval);
    heldDelay = null;
    heldInterval = null;
    heldMovementKeys.clear();
  }

  function handleBlur(): void {
    keySequence = createKeySequenceState();
    clearHeldMovement();
  }

  function clearPointerIdleTimer(): void {
    if (pointerIdleTimer !== null) window.clearTimeout(pointerIdleTimer);
    pointerIdleTimer = null;
  }

  function showPointer(scheduleHide = true): void {
    pointerHidden = false;
    clearPointerIdleTimer();
    if (!scheduleHide) return;
    pointerIdleTimer = window.setTimeout(() => {
      pointerIdleTimer = null;
      pointerHidden = true;
    }, POINTER_IDLE_MS);
  }

  function hidePointer(): void {
    clearPointerIdleTimer();
    pointerHidden = true;
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (movementForKey(event.key)) {
      event.preventDefault();
      if (event.repeat) return;
      heldMovementKeys.add(event.key);
      scheduleHeldMovement();
    }
    const result = interpretKey(keySequence, event.key, event.shiftKey);
    keySequence = result.state;
    if (!result.handled) return;
    event.preventDefault();
    if (result.command) {
      dispatch(result.command);
      if (result.command.type === "move-cursor" || result.command.type === "repeat-motion") {
        hidePointer();
      }
    }
  }

  function handleKeyup(event: KeyboardEvent): void {
    if (!movementForKey(event.key)) return;
    event.preventDefault();
    heldMovementKeys.delete(event.key);
    if (heldMovementKeys.size === 0) clearHeldMovement();
  }

  function handlePointer(event: PointerEvent): void {
    const bounds = canvas.getBoundingClientRect();
    const layout = squareGridAtScale(
      bounds.width,
      bounds.height,
      Math.max(1, visibleExtent.columns),
      Math.max(1, visibleExtent.rows),
      state.zoomDenominator,
      state.viewX,
      state.viewY,
    );
    const cursor = cellForPoint(event.clientX, event.clientY, bounds, layout);
    if (
      axisValueAt(state.xAxis, cursor.x) === null
      || axisValueAt(state.yAxis, cursor.y) === null
    ) return;
    dispatch({ type: "set-cursor", ...cursor });
  }

  function beginPointer(event: PointerEvent): void {
    if (event.button !== 0) return;
    showPointer(false);
    event.preventDefault();
    handlePointer(event);
    canvas.focus();
    dragPointerId = event.pointerId;
    dragStartX = dragLastX = event.clientX;
    dragStartY = dragLastY = event.clientY;
    panning = false;
    canvas.setPointerCapture(event.pointerId);
  }

  function movePointer(event: PointerEvent): void {
    showPointer(dragPointerId === null);
    if (event.pointerId !== dragPointerId) {
      handlePointer(event);
      return;
    }

    const dx = event.clientX - dragLastX;
    const dy = event.clientY - dragLastY;
    if (!panning && Math.hypot(event.clientX - dragStartX, event.clientY - dragStartY) >= 4) {
      panning = true;
    }
    dragLastX = event.clientX;
    dragLastY = event.clientY;
    if (!panning || (dx === 0 && dy === 0)) return;

    const bounds = canvas.getBoundingClientRect();
    const cellSize = Math.min(bounds.width, bounds.height) / state.zoomDenominator;
    dispatch({ type: "pan-view", dx: -dx / cellSize, dy: -dy / cellSize });
  }

  function endPointer(event: PointerEvent): void {
    if (event.pointerId !== dragPointerId) return;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    dragPointerId = null;
    panning = false;
    showPointer();
  }

  function applyWheelZoom(): void {
    wheelFrame = null;
    const bounds = canvas.getBoundingClientRect();
    const cellSize = Math.min(bounds.width, bounds.height) / state.zoomDenominator;
    const denominator = wheelZoomDenominator(
      state.zoomDenominator,
      pendingWheelDelta,
    );
    if (denominator === state.zoomDenominator) return;

    pendingWheelDelta = 0;
    dispatch({
      type: "zoom-at",
      anchorX: (pendingWheelX - bounds.width / 2) / cellSize,
      anchorY: (pendingWheelY - bounds.height / 2) / cellSize,
      denominator,
    });
  }

  function handleWheel(event: WheelEvent): void {
    event.preventDefault();
    showPointer();
    const bounds = canvas.getBoundingClientRect();
    const normalizedDelta = event.deltaMode === 1
      ? event.deltaY * 16
      : event.deltaMode === 2
        ? event.deltaY * bounds.height
        : event.deltaY;
    if (Math.abs(normalizedDelta) < 0.01) return;

    pendingWheelDelta += normalizedDelta;
    pendingWheelX = event.clientX - bounds.left;
    pendingWheelY = event.clientY - bounds.top;
    if (wheelFrame === null) wheelFrame = requestAnimationFrame(applyWheelZoom);
  }
</script>

<canvas
  bind:this={canvas}
  aria-label="Interactive GCD and LCM lattice"
  class:panning
  class:pointer-hidden={pointerHidden}
  on:blur={handleBlur}
  on:keydown={handleKeydown}
  on:keyup={handleKeyup}
  on:pointercancel={endPointer}
  on:pointerdown={beginPointer}
  on:pointerleave={() => showPointer(false)}
  on:pointermove={movePointer}
  on:pointerup={endPointer}
  on:wheel|nonpassive={handleWheel}
  tabindex="0"
></canvas>
