import { TableElement } from "../../table-types";

export const getSpannedColIndexesOfRow = (
  tableNode: TableElement,
  rowIdx: number,
) => {
  const rowSpannedAt = new Set<number>();
  const numberOfCols = tableNode.children[rowIdx]?.children.length;

  if (!numberOfCols) {
    // malformed table
    console.error("malformed table", tableNode, rowIdx);

    return rowSpannedAt;
  }

  for (let colIdx = 0; colIdx < numberOfCols; colIdx++) {
    // @ts-ignore
    const checkCell = tableNode.children[rowIdx].children[colIdx]!;

    if (checkCell.colSpan === 0) {
      rowSpannedAt.add(colIdx);
    } else {
      // skip colSpanned cells
      colIdx += checkCell.colSpan - 1;
    }
  }

  return rowSpannedAt;
};
