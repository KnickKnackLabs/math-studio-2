import type { FieldProgram } from "../fields/field";
import { fieldPreset } from "../fields/field";
import {
  DEFAULT_VISUALIZATION,
  type VisualizationConfig,
} from "../visualization/encoding";
import type { AxisKind } from "./axis";

export type Operation = "gcd" | "lcm";

export const PERFORMANCE_WINDOWS = [1, 2, 3, 5, 10, 20, 30] as const;
export type PerformanceWindowSeconds = typeof PERFORMANCE_WINDOWS[number];

export interface Cursor {
  x: number;
  y: number;
}

export interface Motion {
  dx: number;
  dy: number;
}

export interface MimState {
  cursor: Cursor | null;
  field: FieldProgram;
  helpVisible: boolean;
  recordedMotion: Motion[];
  recordingMotion: Motion[];
  motionEnd: Cursor | null;
  motionStart: Cursor | null;
  operation: Operation | null;
  performanceVisible: boolean;
  performanceWindowSeconds: PerformanceWindowSeconds;
  pinCursor: boolean;
  showPrimeResults: boolean;
  viewX: number;
  viewY: number;
  visualization: VisualizationConfig;
  xAxis: AxisKind;
  yAxis: AxisKind;
  zoomDenominator: number;
}

export const MIN_ZOOM_DENOMINATOR = 1;
export const MAX_ZOOM_DENOMINATOR = 256;

export function createInitialState(): MimState {
  return {
    cursor: null,
    field: fieldPreset("lcm"),
    helpVisible: false,
    recordedMotion: [],
    recordingMotion: [],
    motionEnd: null,
    motionStart: null,
    operation: "lcm",
    performanceVisible: true,
    performanceWindowSeconds: 3,
    pinCursor: false,
    showPrimeResults: true,
    viewX: 0,
    viewY: 0,
    visualization: {
      ...DEFAULT_VISUALIZATION,
      primeRemovals: [],
    },
    xAxis: "integers",
    yAxis: "integers",
    zoomDenominator: 48,
  };
}
