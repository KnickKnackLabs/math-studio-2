const GOLDEN_ZOOM_STEP = Math.pow((1 + Math.sqrt(5)) / 2, 1 / 8);
const MAX_WHEEL_PIXELS_WITHOUT_ZOOM = 48;

export function wheelZoomDenominator(
  currentDenominator: number,
  accumulatedPixels: number,
): number {
  const factor = Math.pow(GOLDEN_ZOOM_STEP, accumulatedPixels / 100);
  const curvedDenominator = Math.round(currentDenominator * factor);
  return curvedDenominator === currentDenominator
    && Math.abs(accumulatedPixels) >= MAX_WHEEL_PIXELS_WITHOUT_ZOOM
    ? currentDenominator + Math.sign(accumulatedPixels)
    : curvedDenominator;
}
