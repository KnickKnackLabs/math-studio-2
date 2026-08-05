export interface SquareGridLayout {
  cellSize: number;
  columns: number;
  left: number;
  rows: number;
  top: number;
}

export interface VisibleGridExtent {
  columns: number;
  maxX: number;
  maxY: number;
  minX: number;
  minY: number;
  rows: number;
}

export function visibleGridExtent(
  width: number,
  height: number,
  zoomDenominator: number,
  viewX = 0,
  viewY = 0,
): VisibleGridExtent {
  const cellSize = Math.min(width, height) / zoomDenominator;
  const halfColumns = width / cellSize / 2;
  const halfRows = height / cellSize / 2;
  const minX = Math.floor(viewX - halfColumns - 0.5) + 1;
  const minY = Math.floor(viewY - halfRows - 0.5) + 1;
  const maxX = Math.ceil(viewX + halfColumns + 0.5) - 1;
  const maxY = Math.ceil(viewY + halfRows + 0.5) - 1;
  return {
    columns: Math.max(0, maxX - minX + 1),
    maxX,
    maxY,
    minX,
    minY,
    rows: Math.max(0, maxY - minY + 1),
  };
}

export function squareGridAtScale(
  width: number,
  height: number,
  columns: number,
  rows: number,
  zoomDenominator: number,
  viewX = 0,
  viewY = 0,
): SquareGridLayout {
  if (width <= 0 || height <= 0 || columns < 1 || rows < 1 || zoomDenominator < 1) {
    throw new RangeError("scaled grid layout requires positive dimensions, bounds, and zoom");
  }

  const cellSize = Math.min(width, height) / zoomDenominator;
  return {
    cellSize,
    columns,
    left: width / 2 + (0.5 - viewX) * cellSize,
    rows,
    top: height / 2 + (0.5 - viewY) * cellSize,
  };
}

export function coverWithSquareCells(
  width: number,
  height: number,
  columns: number,
  rows: number,
): SquareGridLayout {
  if (width <= 0 || height <= 0 || columns < 1 || rows < 1) {
    throw new RangeError("grid layout requires positive dimensions and bounds");
  }

  return {
    cellSize: Math.max(width / columns, height / rows),
    columns,
    left: 0,
    rows,
    top: 0,
  };
}
