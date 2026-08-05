import { describe, expect, test } from "bun:test";

import { gcd, isPrime, lcm, operate } from "./math";

describe("GCD/LCM instrument math", () => {
  test("computes exact operations", () => {
    expect(gcd(18, 24)).toBe(6);
    expect(lcm(18, 24)).toBe(72);
    expect(operate("gcd", 14, 21)).toBe(7);
    expect(operate("lcm", 14, 21)).toBe(42);
    expect(gcd(-18, 24)).toBe(6);
    expect(gcd(0, 24)).toBe(24);
    expect(gcd(0, 0)).toBe(0);
    expect(lcm(-18, 24)).toBe(72);
    expect(lcm(0, 24)).toBe(0);
  });

  test("classifies prime results", () => {
    expect(isPrime(2)).toBe(true);
    expect(isPrime(47)).toBe(true);
    expect(isPrime(1)).toBe(false);
    expect(isPrime(49)).toBe(false);
  });

  test("rejects invalid integer inputs", () => {
    expect(() => gcd(2.5, 4)).toThrow(RangeError);
    expect(() => lcm(2.5, 4)).toThrow(RangeError);
  });
});
