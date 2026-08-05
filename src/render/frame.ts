export type CellAccent = "prime" | null;

export interface DisplayCell {
  accent: CellAccent;
  column: number;
  equalValues: boolean;
  fill: string;
  intensity: number;
  motionEnd: boolean;
  motionStart: boolean;
  selected: boolean;
  sign: number;
  row: number;
  value: number;
  xValue: number;
  yValue: number;
}

export interface DisplayFrame {
  cells: DisplayCell[];
  columns: number;
  maximumValue: number;
  rows: number;
  viewX: number;
  viewY: number;
  zoomDenominator: number;
}
