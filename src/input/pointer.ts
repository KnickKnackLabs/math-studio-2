import type { Cursor } from "../core/state";
import type { SquareGridLayout } from "../render/layout";

export interface PointerBounds {
  left: number;
  top: number;
}

export function cellForPoint(
  clientX: number,
  clientY: number,
  bounds: PointerBounds,
  layout: SquareGridLayout,
): Cursor {
  const localX = clientX - bounds.left - layout.left;
  const localY = clientY - bounds.top - layout.top;
  const x = Math.floor(localX / layout.cellSize) + 1;
  const y = Math.floor(localY / layout.cellSize) + 1;
  return { x, y };
}
