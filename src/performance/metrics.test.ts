import { describe, expect, test } from "bun:test";

import {
  installPerformanceLogApi,
  maybeLogPerformanceSummary,
  performanceSnapshot,
  recordRender,
  type PerformanceSnapshot,
  type RenderSample,
} from "./metrics";

function sample(sampledAt: number, totalMs: number): RenderSample {
  return {
    context: {
      cellCount: 120,
      columns: 12,
      cursor: { x: -2, y: 5 },
      operation: "lcm",
      pinCursor: false,
      rows: 10,
      showPrimeResults: true,
      viewX: 0,
      viewY: 0,
      xAxis: "integers",
      yAxis: "integers",
      zoomDenominator: 48,
    },
    paintMs: totalMs * 0.75,
    prepareMs: totalMs * 0.25,
    sampledAt,
    totalMs,
    wallTime: 1_700_000_000_000 + sampledAt,
  };
}

function snapshotFor(sampledAt: number): PerformanceSnapshot {
  const latest = sample(sampledAt, 4);
  return {
    idle: false,
    latest,
    maximumTotalMs: 4,
    minimumTotalMs: 4,
    overBudgetCount: 0,
    p95TotalMs: 4,
    redrawsPerSecond: 1,
    sampleCount: 1,
    slowest: latest,
    windowSeconds: 3,
  };
}

class MemoryStorage {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

function installWindow(storage: MemoryStorage): void {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage: storage },
  });
}

describe("performance metrics", () => {
  test("aggregates only the selected window and reports idle redraws", () => {
    const now = 1_000_000;
    performanceSnapshot(30, now);
    recordRender(sample(now - 2_000, 5));
    recordRender(sample(now - 500, 20));
    recordRender(sample(now, 10));

    const recent = performanceSnapshot(1, now);
    expect(recent.sampleCount).toBe(2);
    expect(recent.redrawsPerSecond).toBe(2);
    expect(recent.minimumTotalMs).toBe(10);
    expect(recent.maximumTotalMs).toBe(20);
    expect(recent.p95TotalMs).toBe(20);
    expect(recent.overBudgetCount).toBe(1);
    expect(recent.latest?.totalMs).toBe(10);
    expect(recent.slowest?.totalMs).toBe(20);
    expect(recent.idle).toBe(false);

    const wider = performanceSnapshot(3, now);
    expect(wider.sampleCount).toBe(3);
    expect(wider.redrawsPerSecond).toBe(1);
    expect(performanceSnapshot(3, now + 1_001).idle).toBe(true);
  });

  test("retains 500 summaries and fails open when storage is unavailable", () => {
    const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
    const originalInfo = console.info;
    const originalWarn = console.warn;
    console.info = () => {};
    console.warn = () => {};

    try {
      const storage = new MemoryStorage();
      installWindow(storage);
      installPerformanceLogApi();
      for (let index = 0; index <= 500; index += 1) {
        maybeLogPerformanceSummary(snapshotFor(index), (index + 1) * 1_000);
      }

      const entries = window.mimPerformanceLog.read();
      expect(entries).toHaveLength(500);
      expect(entries[0].latest.sampledAt).toBe(1);
      expect(entries.at(-1)?.latest.sampledAt).toBe(500);
      window.mimPerformanceLog.clear();
      expect(window.mimPerformanceLog.read()).toEqual([]);

      installWindow({
        getItem(): string | null {
          throw new Error("storage unavailable");
        },
        removeItem(): void {
          throw new Error("storage unavailable");
        },
        setItem(): void {
          throw new Error("storage unavailable");
        },
        values: new Map(),
      });
      installPerformanceLogApi();
      expect(window.mimPerformanceLog.read()).toEqual([]);
      expect(() => window.mimPerformanceLog.clear()).not.toThrow();
      expect(() => maybeLogPerformanceSummary(snapshotFor(10_000), 1_000_000)).not.toThrow();
    } finally {
      console.info = originalInfo;
      console.warn = originalWarn;
      if (originalWindow) {
        Object.defineProperty(globalThis, "window", originalWindow);
      } else {
        delete (globalThis as { window?: Window }).window;
      }
    }
  });
});
