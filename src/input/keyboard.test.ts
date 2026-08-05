import { expect, test } from "bun:test";

import {
  commandForKey,
  createKeySequenceState,
  interpretKey,
  movementForKeys,
} from "./keyboard";

test("keyboard input maps to semantic commands", () => {
  expect(commandForKey("h")).toEqual({ type: "move-cursor", dx: -1, dy: 0 });
  expect(commandForKey("ArrowDown")).toEqual({ type: "move-cursor", dx: 0, dy: 1 });
  expect(commandForKey("?")).toEqual({ type: "toggle-help" });
  expect(commandForKey("Escape")).toEqual({ type: "escape" });
  expect(commandForKey("g")).toEqual({ type: "set-operation", operation: "gcd" });
  expect(commandForKey("m")).toEqual({ type: "set-operation", operation: "lcm" });
  expect(commandForKey("p")).toEqual({ type: "toggle-prime-results" });
  expect(commandForKey("P")).toEqual({ type: "toggle-performance" });
  expect(commandForKey("[")).toEqual({
    type: "step-performance-window",
    direction: "shorter",
  });
  expect(commandForKey("]")).toEqual({
    type: "step-performance-window",
    direction: "longer",
  });
});

test("held direction keys combine into one grid movement", () => {
  expect(movementForKeys(["h", "j"])).toEqual([-1, 1]);
  expect(movementForKeys(["l", "ArrowUp"])).toEqual([1, -1]);
  expect(movementForKeys(["h", "l"])).toEqual([0, 0]);
});

test("numeric prefixes produce one counted movement command", () => {
  let result = interpretKey(createKeySequenceState(), "1");
  result = interpretKey(result.state, "0");
  result = interpretKey(result.state, "l");
  expect(result.command).toEqual({ type: "move-cursor", dx: 10, dy: 0 });
  expect(result.state).toEqual(createKeySequenceState());

  expect(commandForKey(" ", 1, false)).toEqual({ type: "repeat-motion", reverse: false });
  expect(commandForKey(" ", 1, true)).toEqual({ type: "repeat-motion", reverse: true });
});
