import { describe, expect, test } from "bun:test";

import { axisMinimumIndex, axisValueAt } from "./axis";

describe("numeric axes", () => {
  test("map grid indices to signed and one-sided values", () => {
    expect(axisValueAt("integers", -2)).toBe(-2);
    expect(axisValueAt("even-integers", -2)).toBe(-4);
    expect(axisValueAt("naturals", -1)).toBeNull();
    expect(axisValueAt("naturals", 0)).toBe(1);
    expect(axisValueAt("primes", -1)).toBeNull();
    expect([0, 1, 2, 3, 4].map((index) => axisValueAt("primes", index))).toEqual([
      2,
      3,
      5,
      7,
      11,
    ]);
  });

  test("declare lower index bounds only for one-sided axes", () => {
    expect(axisMinimumIndex("integers")).toBeNull();
    expect(axisMinimumIndex("even-integers")).toBeNull();
    expect(axisMinimumIndex("naturals")).toBe(0);
    expect(axisMinimumIndex("primes")).toBe(0);
  });
});
