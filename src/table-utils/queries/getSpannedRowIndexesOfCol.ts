import { TableElement } from "../../table-types";

export const getSpannedRowIndexesOfCol = (
  tableNode: TableElement,
  insertAt: number,
) => {
  const colSpannedAt = new Set<number>();
  const numberOfRows = tableNode.children.length;

  for (let rowIdx = 0; rowIdx < numberOfRows; rowIdx++) {
    const checkCell = tableNode.children[rowIdx]?.children[insertAt]!;

    if (!checkCell) {
      // malformed table
      console.error("checkCell not found", tableNode, [rowIdx, insertAt]);
      continue;
    }

    if (checkCell.rowSpan === 0) {
      colSpannedAt.add(rowIdx);
    } else {
      // skip rowSpanned cells
      rowIdx += checkCell.rowSpan - 1;
    }
  }
  return colSpannedAt;
};
