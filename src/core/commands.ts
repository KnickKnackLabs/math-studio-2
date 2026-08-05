import type { FieldProgram } from "../fields/field";
import type { VisualizationConfig } from "../visualization/encoding";
import type { AxisKind } from "./axis";
import type { Operation } from "./state";

export type Command =
  | { type: "close-help" }
  | { type: "escape" }
  | { type: "finish-motion" }
  | { type: "move-cursor"; dx: number; dy: number }
  | { type: "pan-view"; dx: number; dy: number }
  | { type: "repeat-motion"; reverse: boolean }
  | { type: "reset-defaults" }
  | { type: "start-motion" }
  | { type: "set-axis"; axis: "x" | "y"; kind: AxisKind }
  | { type: "set-cursor"; x: number; y: number }
  | { type: "set-field"; field: FieldProgram }
  | { type: "set-operation"; operation: Operation }
  | { type: "set-visualization"; visualization: VisualizationConfig }
  | { type: "set-zoom-denominator"; value: number }
  | { type: "step-performance-window"; direction: "shorter" | "longer" }
  | { type: "toggle-help" }
  | { type: "toggle-performance" }
  | { type: "toggle-pin-cursor" }
  | { type: "toggle-prime-results" }
  | { type: "zoom-at"; anchorX: number; anchorY: number; denominator: number }
  | { type: "zoom-in" }
  | { type: "zoom-out" };

export type Dispatch = (command: Command) => void;
