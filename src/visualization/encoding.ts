import { isPrime } from "../instruments/gcd-lcm/math";

export type ColorMode = "bands" | "exact" | "magnitude" | "modulo" | "prime-signature";

export interface PrimeRemoval {
  depth: number | null;
  prime: number;
}

export interface VisualizationConfig {
  bandCount: number;
  colorMode: ColorMode;
  modulo: number;
  primeRemovals: PrimeRemoval[];
  showEqualValues: boolean;
}

export interface PrimeLensResult {
  removed: number[];
  signature: string;
  value: number;
}

export const DEFAULT_VISUALIZATION: VisualizationConfig = {
  bandCount: 8,
  colorMode: "magnitude",
  modulo: 12,
  primeRemovals: [],
  showEqualValues: true,
};

export function primeValuation(value: number, prime: number): number {
  if (!Number.isSafeInteger(value) || !isPrime(prime) || value === 0) return 0;
  let remaining = Math.abs(value);
  let exponent = 0;
  while (remaining % prime === 0) {
    remaining /= prime;
    exponent += 1;
  }
  return exponent;
}

export function removePrimePowers(
  value: number,
  prime: number,
  depth: number | null,
): { removed: number; value: number } {
  if (!Number.isSafeInteger(value) || !isPrime(prime) || value === 0) {
    return { removed: 0, value };
  }

  const limit = depth === null
    ? Number.POSITIVE_INFINITY
    : Math.max(0, Math.floor(depth));
  let remaining = value;
  let removed = 0;
  while (removed < limit && remaining % prime === 0) {
    remaining /= prime;
    removed += 1;
  }
  return { removed, value: remaining };
}

export function applyPrimeLens(
  value: number,
  removals: readonly PrimeRemoval[],
): PrimeLensResult {
  let remaining = value;
  const removed: number[] = [];
  for (const removal of removals) {
    const result = removePrimePowers(remaining, removal.prime, removal.depth);
    remaining = result.value;
    removed.push(result.removed);
  }
  return {
    removed,
    signature: removals.length === 0
      ? "raw"
      : removals.map((removal, index) => `${removal.prime}:${removed[index]}`).join("|"),
    value: remaining,
  };
}

function stableHue(text: string): number {
  let hash = 2166136261;
  for (const character of text) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 360;
}

function intensity(value: number, maximumMagnitude: number): number {
  return Math.log1p(Math.abs(value)) / Math.log1p(Math.max(1, maximumMagnitude));
}

function signedMagnitudeColor(value: number, amount: number): string {
  const hue = value < 0 ? 326 : 204;
  const saturation = 48 + amount * 32;
  const lightness = 15 + amount * 43;
  return `hsl(${hue} ${saturation}% ${lightness}%)`;
}

function exactColor(value: number): string {
  if (value === 0) return "hsl(204 48% 15%)";
  const hue = stableHue(String(value));
  return `hsl(${hue} 68% 56%)`;
}

export function colorForLens(
  lens: PrimeLensResult,
  maximumMagnitude: number,
  config: VisualizationConfig,
): string {
  const amount = intensity(lens.value, maximumMagnitude);

  if (config.colorMode === "exact") return exactColor(lens.value);

  if (config.colorMode === "bands") {
    const count = Math.max(2, Math.floor(config.bandCount));
    const band = Math.round(amount * (count - 1)) / (count - 1);
    return signedMagnitudeColor(lens.value, band);
  }

  if (config.colorMode === "modulo") {
    const modulo = Math.max(2, Math.floor(config.modulo));
    const residue = ((Math.trunc(lens.value) % modulo) + modulo) % modulo;
    const hue = residue / modulo * 360;
    const lightness = 25 + amount * 34;
    return `hsl(${hue} 72% ${lightness}%)`;
  }

  if (config.colorMode === "prime-signature") {
    const hue = stableHue(lens.signature);
    const lightness = 28 + amount * 30;
    return `hsl(${hue} 70% ${lightness}%)`;
  }

  return signedMagnitudeColor(lens.value, amount);
}
