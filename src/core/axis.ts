export type AxisKind = "even-integers" | "integers" | "naturals" | "primes";

export interface AxisOption {
  kind: AxisKind;
  label: string;
}

export const AXIS_OPTIONS: readonly AxisOption[] = [
  { kind: "integers", label: "Integers" },
  { kind: "naturals", label: "Naturals (1, 2, …)" },
  { kind: "even-integers", label: "Even integers" },
  { kind: "primes", label: "Primes" },
];

const primes = [2];

function extendPrimesThrough(index: number): void {
  let candidate = primes[primes.length - 1] + 1;
  while (primes.length <= index) {
    let prime = true;
    for (const divisor of primes) {
      if (divisor * divisor > candidate) break;
      if (candidate % divisor === 0) {
        prime = false;
        break;
      }
    }
    if (prime) primes.push(candidate);
    candidate += 1;
  }
}

export function axisMinimumIndex(kind: AxisKind): number | null {
  return kind === "naturals" || kind === "primes" ? 0 : null;
}

export function axisValueAt(kind: AxisKind, index: number): number | null {
  if (!Number.isSafeInteger(index)) return null;

  switch (kind) {
    case "integers":
      return index;
    case "naturals":
      return index < 0 ? null : index + 1;
    case "even-integers":
      return Number.isSafeInteger(index * 2) ? index * 2 : null;
    case "primes":
      if (index < 0) return null;
      extendPrimesThrough(index);
      return primes[index];
  }
}
