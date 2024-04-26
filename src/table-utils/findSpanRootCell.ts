import { Editor } from "slate";
import { getTableInfo } from "./getTableInfo";
import { TableElement } from "../table-types";

export const findSpanRootLocation = (
  editor: Editor,
  tableIdx: number,
  currentLocation: [number, number]
) => {
  if (currentLocation.length !== 2) {
    // malformed target
    console.error("currentLocation is malformed", currentLocation);

    return null;
  }

  const tableInfo = getTableInfo(editor, tableIdx);

  if (!tableInfo) {
    // target is not inside a table
    return null;
  }

  const { tableNode } = tableInfo;

  const cell =
    tableNode.children[currentLocation[0]]?.children[currentLocation[1]];

  if (!cell) {
    return null;
  }

  if (cell.rowSpan > 0 && cell.colSpan > 0) {
    return currentLocation;
  }

  if (cell.rowSpan > 0 || cell.colSpan > 0) {
    // malformed, should not happen
    console.error("cell is spanned but not a root cell", cell);

    return null;
  }

  // the rowSpan and colSpan are both 0 here
  const rowSpannedFrom = findRowIdxOfSpanRoot(tableNode, currentLocation);
  const colSpannedFrom = findColIdxOfSpanRoot(tableNode, currentLocation);

  return [rowSpannedFrom, colSpannedFrom];
};

export const findRowIdxOfSpanRoot = (
  tableNode: TableElement,
  currentLocation: [number, number]
) => {
  let rowSpannedFrom = currentLocation[0] - 1;

  while (rowSpannedFrom >= 0) {
    const checkCell =
      tableNode.children[rowSpannedFrom]?.children?.[currentLocation[1]];

    if (!checkCell) {
      // top boundary of the table reached
      rowSpannedFrom = 0;

      break;
    }

    if (checkCell.rowSpan > 0) {
      if (rowSpannedFrom + checkCell.rowSpan - 1 >= currentLocation[0]) {
        // span root cell found
      } else {
        // top boundary of the spanned cell reached
        rowSpannedFrom++;
      }

      break;
    }

    rowSpannedFrom--;
  }

  return rowSpannedFrom;
};

export const findColIdxOfSpanRoot = (
  tableNode: TableElement,
  currentLocation: [number, number]
) => {
  let colSpannedFrom = currentLocation[1] - 1;

  while (colSpannedFrom >= 0) {
    const checkCell =
      tableNode.children[currentLocation[0]]?.children?.[colSpannedFrom];

    if (!checkCell) {
      // left boundary of the table reached
      colSpannedFrom = 0;

      break;
    }

    if (checkCell.colSpan > 0) {
      if (colSpannedFrom + checkCell.colSpan - 1 >= currentLocation[1]) {
        // span root cell found
      } else {
        // left boundary of the spanned cell reached
        colSpannedFrom++;
      }

      break;
    }

    colSpannedFrom--;
  }

  return colSpannedFrom;
};
