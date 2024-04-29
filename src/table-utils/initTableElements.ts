import { CellElement, RowElement, TableElement } from "../table-types";

type InitTableProps = {
  rows?: number;
  cols?: number;
};

export const initTable = ({
  rows = 3,
  cols = 3,
}: InitTableProps): TableElement => {
  const table = {
    type: "table" as const,
    settings: {
      colSizes: Array.from({ length: cols }, () => 0),
      rowSizes: Array.from({ length: rows }, () => 0),
    },
    children: [] as RowElement[],
  };

  for (let rowIdx = 0; rowIdx < rows; rowIdx++) {
    // @ts-ignore
    table.children.push(initRow(cols));
  }

  console.log("init", table);

  return table;
};

export const initRow = (cols: number): RowElement => {
  const row = {
    type: "table-row" as const,
    children: [],
  };

  for (let colIdx = 0; colIdx < cols; colIdx++) {
    // @ts-ignore
    row.children.push(initCell());
  }

  return row;
};

export const initCell = (): CellElement => {
  const cell = {
    type: "table-cell" as const,
    rowSpan: 1,
    colSpan: 1,
    children: [
      {
        // @ts-ignore
        type: "paragraph",
        children: [{ text: "" }],
      },
    ],
  };

  return cell;
};
