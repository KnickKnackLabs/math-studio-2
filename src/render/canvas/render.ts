import type { DisplayCell, DisplayFrame } from "../frame";
import { squareGridAtScale } from "../layout";

export interface RenderSize {
  cssHeight: number;
  cssWidth: number;
  pixelRatio: number;
}

function fillFor(cell: DisplayCell): string {
  return cell.accent === "prime" ? "#f59e42" : cell.fill;
}

export function renderFrame(
  canvas: HTMLCanvasElement,
  frame: DisplayFrame,
  size: RenderSize,
): void {
  const width = Math.max(1, Math.floor(size.cssWidth));
  const height = Math.max(1, Math.floor(size.cssHeight));
  const ratio = Math.max(1, size.pixelRatio);
  const pixelWidth = Math.floor(width * ratio);
  const pixelHeight = Math.floor(height * ratio);

  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is unavailable");

  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.fillStyle = "#071827";
  context.fillRect(0, 0, width, height);

  const layout = squareGridAtScale(
    width,
    height,
    frame.columns,
    frame.rows,
    frame.zoomDenominator,
    frame.viewX,
    frame.viewY,
  );
  const gap = Math.min(1, Math.max(0.15, layout.cellSize * 0.04));

  for (const cell of frame.cells) {
    const left = layout.left + (cell.column - 1) * layout.cellSize;
    const top = layout.top + (cell.row - 1) * layout.cellSize;
    const visibleSize = Math.max(0, layout.cellSize - gap * 2);
    context.fillStyle = fillFor(cell);
    context.fillRect(left + gap, top + gap, visibleSize, visibleSize);

    if (cell.equalValues && cell.accent === null) {
      context.fillStyle = "rgba(224, 242, 254, 0.28)";
      context.fillRect(left + gap, top + gap, visibleSize, visibleSize);
    }

    if (cell.motionStart || cell.motionEnd) {
      context.strokeStyle = cell.motionEnd ? "#f0abfc" : "#67e8f9";
      context.lineWidth = Math.max(1, layout.cellSize * 0.1);
      context.strokeRect(
        left + context.lineWidth / 2,
        top + context.lineWidth / 2,
        Math.max(0, layout.cellSize - context.lineWidth),
        Math.max(0, layout.cellSize - context.lineWidth),
      );
    }

    if (cell.selected) {
      context.strokeStyle = "#ffffff";
      context.lineWidth = Math.max(1, layout.cellSize * 0.12);
      context.strokeRect(
        left + context.lineWidth / 2,
        top + context.lineWidth / 2,
        Math.max(0, layout.cellSize - context.lineWidth),
        Math.max(0, layout.cellSize - context.lineWidth),
      );
    }
  }
}
