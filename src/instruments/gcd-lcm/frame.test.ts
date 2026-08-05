import { expect, test } from "bun:test";

import { createInitialState } from "../../core/state";
import { buildFrame } from "./frame";

test("buildFrame prepares renderer-facing classifications", () => {
  const frame = buildFrame(
    { ...createInitialState(), cursor: { x: 2, y: 2 } },
    { columns: 3, maxX: 3, maxY: 3, minX: 1, minY: 1, rows: 3 },
  );

  expect(frame.cells).toHaveLength(9);
  expect(frame.maximumValue).toBe(6);
  expect(frame.cells.find((cell) => cell.column === 2 && cell.row === 2)).toMatchObject({
    accent: "prime",
    equalValues: true,
    selected: true,
    value: 2,
    xValue: 2,
    yValue: 2,
  });
});

test("buildFrame separates grid positions from generated axis values", () => {
  const frame = buildFrame(
    { ...createInitialState(), xAxis: "primes", yAxis: "naturals" },
    { columns: 3, maxX: 2, maxY: 2, minX: 0, minY: 0, rows: 3 },
  );

  expect(frame.cells.find((cell) => cell.column === 1 && cell.row === 2)).toMatchObject({
    column: 1,
    equalValues: true,
    row: 2,
    value: 3,
    xValue: 3,
    yValue: 3,
  });
});
