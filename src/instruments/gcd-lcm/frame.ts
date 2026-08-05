import { axisValueAt } from "../../core/axis";
import type { MimState } from "../../core/state";
import { evaluateField } from "../../fields/field";
import type { DisplayCell, DisplayFrame } from "../../render/frame";
import type { VisibleGridExtent } from "../../render/layout";
import {
  applyPrimeLens,
  colorForLens,
  type PrimeLensResult,
} from "../../visualization/encoding";
import { isPrime } from "./math";

interface RawCell extends Omit<DisplayCell, "fill" | "intensity"> {
  lens: PrimeLensResult;
}

export function buildFrame(state: MimState, extent: VisibleGridExtent): DisplayFrame {
  const raw: RawCell[] = [];
  let maximumValue = 1;

  for (let row = extent.minY; row <= extent.maxY; row += 1) {
    const yValue = axisValueAt(state.yAxis, row);
    if (yValue === null) continue;

    for (let column = extent.minX; column <= extent.maxX; column += 1) {
      const xValue = axisValueAt(state.xAxis, column);
      if (xValue === null) continue;

      const fieldValue = evaluateField(state.field, {
        x: xValue,
        xi: column,
        y: yValue,
        yi: row,
      });
      const lens = applyPrimeLens(fieldValue, state.visualization.primeRemovals);
      maximumValue = Math.max(maximumValue, Math.abs(lens.value));
      raw.push({
        accent: state.showPrimeResults && isPrime(fieldValue) ? "prime" : null,
        column,
        equalValues: state.visualization.showEqualValues && xValue === yValue,
        lens,
        motionEnd: state.motionEnd?.x === column && state.motionEnd?.y === row,
        motionStart: state.motionStart?.x === column && state.motionStart?.y === row,
        row,
        selected: state.cursor?.x === column && state.cursor?.y === row,
        sign: Math.sign(lens.value),
        value: lens.value,
        xValue,
        yValue,
      });
    }
  }

  const denominator = Math.log1p(maximumValue);
  return {
    cells: raw.map(({ lens, ...cell }) => ({
      ...cell,
      fill: colorForLens(lens, maximumValue, state.visualization),
      intensity: Math.log1p(Math.abs(cell.value)) / denominator,
    })),
    columns: Math.max(1, extent.columns),
    maximumValue,
    rows: Math.max(1, extent.rows),
    viewX: state.viewX,
    viewY: state.viewY,
    zoomDenominator: state.zoomDenominator,
  };
}
