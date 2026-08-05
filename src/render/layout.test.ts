import { expect, test } from "bun:test";

import {
  coverWithSquareCells,
  squareGridAtScale,
  visibleGridExtent,
} from "./layout";

test("square cells cover a wide viewport without stretching", () => {
  const layout = coverWithSquareCells(1440, 1000, 48, 48);
  expect(layout.cellSize).toBe(30);
  expect(layout.cellSize * layout.columns).toBeGreaterThanOrEqual(1440);
  expect(layout.cellSize * layout.rows).toBeGreaterThanOrEqual(1000);
});

test("square cells cover a tall viewport without stretching", () => {
  const layout = coverWithSquareCells(1000, 1440, 48, 48);
  expect(layout.cellSize).toBe(30);
  expect(layout.cellSize * layout.columns).toBeGreaterThanOrEqual(1000);
  expect(layout.cellSize * layout.rows).toBeGreaterThanOrEqual(1440);
});

test("unit-fraction camera scale and view offsets share one layout", () => {
  const layout = squareGridAtScale(1440, 900, 96, 96, 45, 2.5, -1);
  expect(layout.cellSize).toBe(20);
  expect(layout.left).toBe(680);
  expect(layout.top).toBe(480);
});

test("the initial camera centers a signed lattice on zero", () => {
  expect(visibleGridExtent(400, 400, 4)).toEqual({
    columns: 5,
    maxX: 2,
    maxY: 2,
    minX: -2,
    minY: -2,
    rows: 5,
  });
});
