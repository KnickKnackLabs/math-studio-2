import type { AxisKind } from "../core/axis";

const FRAME_BUDGET_MS = 1000 / 60;
const MAX_LOG_ENTRIES = 500;
const MAX_SAMPLE_AGE_MS = 30_000;
const STORAGE_KEY = "mim.performance.v1";

export interface RenderContext {
  cellCount: number;
  columns: number;
  cursor: { x: number; y: number } | null;
  operation: string;
  pinCursor: boolean;
  rows: number;
  showPrimeResults: boolean;
  viewX: number;
  viewY: number;
  xAxis: AxisKind;
  yAxis: AxisKind;
  zoomDenominator: number;
}

export interface RenderSample {
  context: RenderContext;
  paintMs: number;
  prepareMs: number;
  sampledAt: number;
  totalMs: number;
  wallTime: number;
}

export interface PerformanceSnapshot {
  idle: boolean;
  latest: RenderSample | null;
  maximumTotalMs: number;
  minimumTotalMs: number;
  overBudgetCount: number;
  p95TotalMs: number;
  redrawsPerSecond: number;
  sampleCount: number;
  slowest: RenderSample | null;
  windowSeconds: number;
}

export interface PerformanceLogEntry {
  latest: RenderSample;
  loggedAt: string;
  maximumTotalMs: number;
  minimumTotalMs: number;
  overBudgetCount: number;
  p95TotalMs: number;
  redrawsPerSecond: number;
  sampleCount: number;
  slowest: RenderSample;
  windowSeconds: number;
}

export interface PerformanceLogApi {
  clear(): void;
  read(): PerformanceLogEntry[];
}

declare global {
  interface Window {
    mimPerformanceLog: PerformanceLogApi;
  }
}

const samples: RenderSample[] = [];
let lastLoggedAt = 0;
let lastLoggedSampleAt = -1;

function pruneSamples(now: number): void {
  const oldestAllowed = now - MAX_SAMPLE_AGE_MS;
  const firstCurrent = samples.findIndex((sample) => sample.sampledAt >= oldestAllowed);
  if (firstCurrent === -1) {
    samples.length = 0;
  } else if (firstCurrent > 0) {
    samples.splice(0, firstCurrent);
  }
}

function percentile95(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)];
}

export function recordRender(sample: RenderSample): void {
  samples.push(sample);
  pruneSamples(sample.sampledAt);
}

export function performanceSnapshot(
  windowSeconds: number,
  now = performance.now(),
): PerformanceSnapshot {
  pruneSamples(now);
  const windowSamples = samples.filter(
    (sample) => sample.sampledAt >= now - windowSeconds * 1000,
  );
  const latest = windowSamples.at(-1) ?? null;
  const totals = windowSamples.map((sample) => sample.totalMs);
  const slowest = windowSamples.reduce<RenderSample | null>(
    (current, sample) => current === null || sample.totalMs > current.totalMs ? sample : current,
    null,
  );

  return {
    idle: latest === null || now - latest.sampledAt >= 1000,
    latest,
    maximumTotalMs: totals.length === 0 ? 0 : Math.max(...totals),
    minimumTotalMs: totals.length === 0 ? 0 : Math.min(...totals),
    overBudgetCount: totals.filter((duration) => duration > FRAME_BUDGET_MS).length,
    p95TotalMs: percentile95(totals),
    redrawsPerSecond: windowSamples.length / windowSeconds,
    sampleCount: windowSamples.length,
    slowest,
    windowSeconds,
  };
}

function readStoredLog(): PerformanceLogEntry[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === null) return [];
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed as PerformanceLogEntry[] : [];
  } catch (error) {
    console.warn("mim performance log could not be read", error);
    return [];
  }
}

function clearStoredLog(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("mim performance log could not be cleared", error);
  }
}

function storeLogEntry(entry: PerformanceLogEntry): void {
  try {
    const entries = [...readStoredLog(), entry].slice(-MAX_LOG_ENTRIES);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.warn("mim performance summary was not persisted", error);
  }
}

export function installPerformanceLogApi(): void {
  window.mimPerformanceLog = {
    clear: clearStoredLog,
    read: readStoredLog,
  };
}

export function maybeLogPerformanceSummary(
  snapshot: PerformanceSnapshot,
  now = Date.now(),
): void {
  if (
    snapshot.latest === null
    || snapshot.slowest === null
    || snapshot.latest.sampledAt === lastLoggedSampleAt
    || now - lastLoggedAt < 1000
  ) return;

  const entry: PerformanceLogEntry = {
    latest: snapshot.latest,
    loggedAt: new Date(now).toISOString(),
    maximumTotalMs: snapshot.maximumTotalMs,
    minimumTotalMs: snapshot.minimumTotalMs,
    overBudgetCount: snapshot.overBudgetCount,
    p95TotalMs: snapshot.p95TotalMs,
    redrawsPerSecond: snapshot.redrawsPerSecond,
    sampleCount: snapshot.sampleCount,
    slowest: snapshot.slowest,
    windowSeconds: snapshot.windowSeconds,
  };
  lastLoggedAt = now;
  lastLoggedSampleAt = snapshot.latest.sampledAt;
  console.info("mim performance", entry);
  storeLogEntry(entry);
}
