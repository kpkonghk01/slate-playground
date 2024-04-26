import { Editor, Transforms } from "slate";
import { CellElement } from "../../table-types";
import { initRow } from "../initTableElements";
import { getTableInfo } from "../getTableInfo";
import { findRowIdxOfSpanRoot } from "../findSpanRootCell";

// target should in the form of [tableIdxAtRoot, rowIdx]
export const insertRow = (editor: Editor, target: [number, number]) => {
  if (target.length !== 2) {
    // malformed target
    return;
  }

  const [tableIdx, insertAt] = target;
  const tableInfo = getTableInfo(editor, tableIdx);

  if (!tableInfo) {
    // target is not inside a table
    return;
  }

  const { tableNode, numberOfRows, numberOfCols } = tableInfo;

  if (insertAt < 0 || insertAt > numberOfRows) {
    // out of range
    return;
  }

  const rowSpannedAt = new Set<number>();

  for (let colIdx = 0; colIdx < numberOfCols; colIdx++) {
    // @ts-ignore
    const checkCell = tableNode.children[insertAt].children[colIdx]!;

    if (checkCell.colSpan === 0) {
      rowSpannedAt.add(colIdx);
    } else {
      // skip colSpanned cells
      colIdx += checkCell.colSpan - 1;
    }
  }

  const newRow = initRow(numberOfCols);

  for (let colIdx = 0; colIdx < numberOfCols; colIdx++) {
    // existence is ensured by initRow
    const newCell = newRow.children[colIdx] as CellElement;

    if (!rowSpannedAt.has(colIdx)) {
      continue;
    }

    newCell.rowSpan = 0;
    newCell.colSpan = 0;

    // find the root span cell if it is in the same column
    const rowSpannedFrom = findRowIdxOfSpanRoot(tableNode, [insertAt, colIdx]);

    const rowSpanCell = tableNode.children[rowSpannedFrom]!.children[colIdx]!;

    if (colIdx === 13) {
      console.log(rowSpanCell, rowSpannedFrom);
    }

    if (rowSpanCell.rowSpan === 0) {
      continue;
    }

    if (rowSpannedFrom + rowSpanCell.rowSpan - 1 >= insertAt) {
      // extend the rowSpanned cell
      Transforms.setNodes<CellElement>(
        editor,
        {
          rowSpan: rowSpanCell.rowSpan + 1,
        },
        {
          at: [tableIdx, rowSpannedFrom, colIdx],
        }
      );
    }
  }

  Transforms.insertNodes(editor, newRow, { at: target });
};
