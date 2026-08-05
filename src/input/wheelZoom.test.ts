import { describe, expect, test } from "bun:test";

import { wheelZoomDenominator } from "./wheelZoom";

describe("wheelZoomDenominator", () => {
  test("caps the wheel distance needed to leave low denominators", () => {
    expect(wheelZoomDenominator(1, 47)).toBe(1);
    expect(wheelZoomDenominator(1, 48)).toBe(2);
    expect(wheelZoomDenominator(2, -48)).toBe(1);
  });

  test("preserves the curved response when it crosses a level sooner", () => {
    expect(wheelZoomDenominator(48, 10)).toBe(48);
    expect(wheelZoomDenominator(48, 20)).toBe(49);
    expect(wheelZoomDenominator(48, 100)).toBe(51);
  });
});
