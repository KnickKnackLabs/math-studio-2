import type { Operation } from "../../core/state";

function requireSafeInteger(value: number): void {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`expected a safe integer, got ${value}`);
  }
}

export function gcd(left: number, right: number): number {
  requireSafeInteger(left);
  requireSafeInteger(right);

  let a = Math.abs(left);
  let b = Math.abs(right);
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
}

export function lcm(left: number, right: number): number {
  requireSafeInteger(left);
  requireSafeInteger(right);
  if (left === 0 || right === 0) return 0;
  const value = (Math.abs(left) / gcd(left, right)) * Math.abs(right);
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`LCM exceeds safe integer range: ${left}, ${right}`);
  }
  return value;
}

export function operate(operation: Operation, left: number, right: number): number {
  return operation === "gcd" ? gcd(left, right) : lcm(left, right);
}

export function isPrime(value: number): boolean {
  if (!Number.isSafeInteger(value) || value < 2) return false;
  if (value === 2) return true;
  if (value % 2 === 0) return false;
  for (let divisor = 3; divisor * divisor <= value; divisor += 2) {
    if (value % divisor === 0) return false;
  }
  return true;
}
