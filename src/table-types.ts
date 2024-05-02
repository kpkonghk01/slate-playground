import { Descendant } from "slate";

export type CellsRange = [[number, number], [number, number]];

export type CellElement = {
  type: "table-cell";
  rowSpan: number;
  colSpan: number;
  children: Descendant[];
};

export type RowElement = {
  type: "table-row";
  children: CellElement[];
};

export type TableElement = {
  type: "table";
  settings: {
    colSizes: number[];
    rowSizes: number[];
  };
  children: RowElement[];
};

export type Position = {
  x: number;
  y: number;
};

export type ResizeDirection = "horizontal" | "vertical";
