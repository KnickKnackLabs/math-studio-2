import { fieldPreset } from "../fields/field";
import { axisMinimumIndex, type AxisKind } from "./axis";
import type { Command } from "./commands";
import {
  createInitialState,
  MAX_ZOOM_DENOMINATOR,
  MIN_ZOOM_DENOMINATOR,
  PERFORMANCE_WINDOWS,
  type Cursor,
  type MimState,
  type PerformanceWindowSeconds,
} from "./state";

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function normalizeZoomDenominator(value: number): number {
  return clamp(
    Math.round(value),
    MIN_ZOOM_DENOMINATOR,
    MAX_ZOOM_DENOMINATOR,
  );
}

function stepZoom(current: number, direction: "in" | "out"): number {
  return normalizeZoomDenominator(current + (direction === "in" ? -1 : 1));
}

function stepPerformanceWindow(
  current: PerformanceWindowSeconds,
  direction: "shorter" | "longer",
): PerformanceWindowSeconds {
  const currentIndex = PERFORMANCE_WINDOWS.indexOf(current);
  const nextIndex = clamp(
    currentIndex + (direction === "shorter" ? -1 : 1),
    0,
    PERFORMANCE_WINDOWS.length - 1,
  );
  return PERFORMANCE_WINDOWS[nextIndex];
}

function normalizeAxisIndex(index: number, kind: AxisKind): number {
  const rounded = Math.round(index);
  const minimum = axisMinimumIndex(kind);
  return minimum === null ? rounded : Math.max(minimum, rounded);
}

function normalizeCursor(cursor: Cursor, state: MimState): Cursor {
  return {
    x: normalizeAxisIndex(cursor.x, state.xAxis),
    y: normalizeAxisIndex(cursor.y, state.yAxis),
  };
}

function defaultCursor(state: MimState): Cursor {
  return normalizeCursor({ x: 0, y: 0 }, state);
}

export function reduceState(state: MimState, command: Command): MimState {
  switch (command.type) {
    case "close-help":
      return state.helpVisible ? { ...state, helpVisible: false } : state;

    case "escape":
      return state.helpVisible
        ? { ...state, helpVisible: false }
        : {
            ...state,
            recordedMotion: [],
            recordingMotion: [],
            motionEnd: null,
            motionStart: null,
          };

    case "reset-defaults":
      return createInitialState();

    case "toggle-help":
      return { ...state, helpVisible: !state.helpVisible };

    case "toggle-performance":
      return { ...state, performanceVisible: !state.performanceVisible };

    case "step-performance-window": {
      const performanceWindowSeconds = stepPerformanceWindow(
        state.performanceWindowSeconds,
        command.direction,
      );
      return performanceWindowSeconds === state.performanceWindowSeconds
        ? state
        : { ...state, performanceWindowSeconds };
    }

    case "toggle-pin-cursor":
      return { ...state, pinCursor: !state.pinCursor };

    case "start-motion": {
      const cursor = state.cursor ?? defaultCursor(state);
      return {
        ...state,
        cursor,
        recordingMotion: [],
        motionEnd: null,
        motionStart: { ...cursor },
      };
    }

    case "finish-motion": {
      if (!state.motionStart || !state.cursor) return state;
      return {
        ...state,
        recordedMotion: [...state.recordingMotion],
        motionEnd: { ...state.cursor },
      };
    }

    case "set-field":
      return {
        ...state,
        field: command.field,
        operation: command.field.id === "gcd" || command.field.id === "lcm"
          ? command.field.id
          : null,
      };

    case "set-operation":
      return {
        ...state,
        field: fieldPreset(command.operation),
        operation: command.operation,
      };

    case "set-visualization":
      return {
        ...state,
        visualization: {
          ...command.visualization,
          primeRemovals: command.visualization.primeRemovals.map((removal) => ({ ...removal })),
        },
      };

    case "set-axis": {
      const next = command.axis === "x"
        ? { ...state, xAxis: command.kind }
        : { ...state, yAxis: command.kind };
      return {
        ...next,
        cursor: next.cursor ? normalizeCursor(next.cursor, next) : null,
        motionEnd: next.motionEnd ? normalizeCursor(next.motionEnd, next) : null,
        motionStart: next.motionStart ? normalizeCursor(next.motionStart, next) : null,
      };
    }

    case "toggle-prime-results":
      return { ...state, showPrimeResults: !state.showPrimeResults };

    case "set-zoom-denominator": {
      if (!Number.isFinite(command.value)) return state;
      const zoomDenominator = normalizeZoomDenominator(command.value);
      return zoomDenominator === state.zoomDenominator
        ? state
        : { ...state, zoomDenominator };
    }

    case "zoom-at": {
      if (
        !Number.isFinite(command.anchorX)
        || !Number.isFinite(command.anchorY)
        || !Number.isFinite(command.denominator)
      ) return state;
      const zoomDenominator = normalizeZoomDenominator(command.denominator);
      if (zoomDenominator === state.zoomDenominator) return state;
      const scale = zoomDenominator / state.zoomDenominator;
      return {
        ...state,
        viewX: state.viewX + command.anchorX - command.anchorX * scale,
        viewY: state.viewY + command.anchorY - command.anchorY * scale,
        zoomDenominator,
      };
    }

    case "zoom-in": {
      const zoomDenominator = stepZoom(state.zoomDenominator, "in");
      return zoomDenominator === state.zoomDenominator
        ? state
        : { ...state, zoomDenominator };
    }

    case "zoom-out": {
      const zoomDenominator = stepZoom(state.zoomDenominator, "out");
      return zoomDenominator === state.zoomDenominator
        ? state
        : { ...state, zoomDenominator };
    }

    case "set-cursor":
      return { ...state, cursor: normalizeCursor(command, state) };

    case "pan-view":
      return Number.isFinite(command.dx) && Number.isFinite(command.dy)
        ? { ...state, viewX: state.viewX + command.dx, viewY: state.viewY + command.dy }
        : state;

    case "move-cursor": {
      const cursor = state.cursor ?? defaultCursor(state);
      const nextCursor = normalizeCursor(
        { x: cursor.x + command.dx, y: cursor.y + command.dy },
        state,
      );
      const motion = { dx: nextCursor.x - cursor.x, dy: nextCursor.y - cursor.y };
      const moved = motion.dx !== 0 || motion.dy !== 0;
      return {
        ...state,
        cursor: nextCursor,
        recordedMotion: state.motionStart && !state.motionEnd
          ? state.recordedMotion
          : moved ? [motion] : state.recordedMotion,
        recordingMotion: state.motionStart && !state.motionEnd && moved
          ? [...state.recordingMotion, motion]
          : state.recordingMotion,
      };
    }

    case "repeat-motion": {
      if (state.recordedMotion.length === 0) return state;
      const motions = command.reverse
        ? [...state.recordedMotion].reverse().map(({ dx, dy }) => ({ dx: -dx, dy: -dy }))
        : state.recordedMotion;
      let cursor = state.cursor ?? defaultCursor(state);
      for (const motion of motions) {
        cursor = normalizeCursor(
          { x: cursor.x + motion.dx, y: cursor.y + motion.dy },
          state,
        );
      }
      return { ...state, cursor };
    }
  }
}
