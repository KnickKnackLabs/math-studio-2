import { describe, expect, test } from "bun:test";

import { reduceState } from "./reducer";
import { createInitialState } from "./state";

describe("reduceState", () => {
  test("applies semantic operation commands", () => {
    const state = reduceState(createInitialState(), {
      type: "set-operation",
      operation: "gcd",
    });
    expect(state.operation).toBe("gcd");
  });

  test("toggles and closes help", () => {
    const initial = createInitialState();
    const visible = reduceState(initial, { type: "toggle-help" });
    expect(visible.helpVisible).toBe(true);
    expect(reduceState(visible, { type: "toggle-help" }).helpVisible).toBe(false);
    expect(reduceState(visible, { type: "close-help" }).helpVisible).toBe(false);
    expect(reduceState(initial, { type: "close-help" })).toBe(initial);
  });

  test("toggles pinned cursor movement", () => {
    const initial = createInitialState();
    expect(reduceState(initial, { type: "toggle-pin-cursor" }).pinCursor).toBe(true);
  });

  test("toggles performance metrics and steps bounded sample windows", () => {
    const initial = createInitialState();
    expect(initial.performanceVisible).toBe(true);
    expect(initial.performanceWindowSeconds).toBe(3);
    expect(reduceState(initial, { type: "toggle-performance" }).performanceVisible).toBe(false);

    let state = reduceState(initial, {
      type: "step-performance-window",
      direction: "shorter",
    });
    expect(state.performanceWindowSeconds).toBe(2);
    state = reduceState(state, { type: "step-performance-window", direction: "shorter" });
    expect(state.performanceWindowSeconds).toBe(1);
    expect(reduceState(state, {
      type: "step-performance-window",
      direction: "shorter",
    })).toBe(state);

    for (let step = 0; step < 10; step += 1) {
      state = reduceState(state, { type: "step-performance-window", direction: "longer" });
    }
    expect(state.performanceWindowSeconds).toBe(30);
    expect(reduceState(state, {
      type: "step-performance-window",
      direction: "longer",
    })).toBe(state);
  });

  test("moves the cursor across signed integer coordinates", () => {
    let state = reduceState(createInitialState(), { type: "move-cursor", dx: -2, dy: 4 });
    expect(state.cursor).toEqual({ x: -2, y: 4 });
    state = reduceState(state, { type: "move-cursor", dx: 500, dy: 500 });
    expect(state.cursor).toEqual({ x: 498, y: 504 });
  });

  test("records, replays, and retraces a movement sequence", () => {
    let state = reduceState(createInitialState(), { type: "set-cursor", x: 40, y: 40 });
    state = reduceState(state, { type: "start-motion" });
    state = reduceState(state, { type: "move-cursor", dx: 3, dy: 0 });
    state = reduceState(state, { type: "move-cursor", dx: 0, dy: -4 });
    state = reduceState(state, { type: "move-cursor", dx: 0, dy: 2 });
    state = reduceState(state, { type: "move-cursor", dx: -9, dy: 0 });
    state = reduceState(state, { type: "finish-motion" });

    expect(state.recordedMotion).toEqual([
      { dx: 3, dy: 0 },
      { dx: 0, dy: -4 },
      { dx: 0, dy: 2 },
      { dx: -9, dy: 0 },
    ]);
    expect(state.cursor).toEqual({ x: 34, y: 38 });

    state = reduceState(state, { type: "set-cursor", x: 50, y: 50 });
    state = reduceState(state, { type: "repeat-motion", reverse: false });
    expect(state.cursor).toEqual({ x: 44, y: 48 });
    state = reduceState(state, { type: "repeat-motion", reverse: true });
    expect(state.cursor).toEqual({ x: 50, y: 50 });
  });

  test("keeps unit-fraction zooms anchored and steps through integer denominators", () => {
    let state = reduceState(createInitialState(), { type: "pan-view", dx: 2.5, dy: -1 });
    state = reduceState(state, {
      type: "zoom-at",
      anchorX: 10,
      anchorY: 20,
      denominator: 24,
    });
    expect(state.zoomDenominator).toBe(24);
    expect(state.viewX).toBe(7.5);
    expect(state.viewY).toBe(9);

    state = reduceState(state, { type: "set-zoom-denominator", value: 13.2 });
    expect(state.zoomDenominator).toBe(13);
    state = reduceState(state, { type: "zoom-out" });
    expect(state.zoomDenominator).toBe(14);
    state = reduceState(state, { type: "zoom-in" });
    expect(state.zoomDenominator).toBe(13);
    expect(reduceState(state, { type: "reset-defaults" })).toEqual(createInitialState());
  });

  test("one-sided axes stop cursor motion at their first generated value", () => {
    let state = reduceState(createInitialState(), { type: "set-cursor", x: -4, y: -3 });
    state = reduceState(state, { type: "set-axis", axis: "y", kind: "naturals" });
    expect(state.cursor).toEqual({ x: -4, y: 0 });
    state = reduceState(state, { type: "move-cursor", dx: 0, dy: -1 });
    expect(state.cursor).toEqual({ x: -4, y: 0 });
  });

  test("normalizes selected coordinates to integers without changing their sign", () => {
    let state = reduceState(createInitialState(), { type: "set-cursor", x: -4.4, y: 0.4 });
    expect(state.cursor).toEqual({ x: -4, y: 0 });
    state = reduceState(state, { type: "move-cursor", dx: -3, dy: -2 });
    expect(state.cursor).toEqual({ x: -7, y: -2 });
  });
});
