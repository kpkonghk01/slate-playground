import { Editor, Transforms } from "slate";
import { initCell } from "../initTableElements";
import { getTableInfo } from "../getTableInfo";
import { CellElement } from "../../table-types";
import { findSpanRootLocation } from "../findSpanRootLocation";
import { getSpannedRowIndexesOfCol } from "../getSpannedRowIndexesOfCol";

// target should in the form of [tableIdxAtRoot, colIdx]
export const insertCol = (editor: Editor, target: [number, number]) => {
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

  if (insertAt < 0 || insertAt > numberOfCols) {
    // out of range
    return;
  }

  const colSpannedAt = getSpannedRowIndexesOfCol(tableNode, insertAt);

  for (let rowIdx = 0; rowIdx < numberOfRows; rowIdx++) {
    const newCell = initCell();

    breakCondition: if (colSpannedAt.has(rowIdx)) {
      newCell.rowSpan = 0;
      newCell.colSpan = 0;

      // extend the colSpanned cell
      const spanRootAt = findSpanRootLocation(tableNode, [rowIdx, insertAt]);

      if (!spanRootAt) {
        // malformed table
        break breakCondition;
      }

      const [, colSpannedFrom] = spanRootAt;
      const colSpanCell = tableNode.children[rowIdx]?.children[colSpannedFrom];

      if (!colSpanCell) {
        // malformed table
        console.error("colSpanCell not found", tableNode, [
          rowIdx,
          colSpannedFrom,
        ]);

        break breakCondition;
      }

      if (colSpanCell.colSpan === 0) {
        // border cell
        break breakCondition;
      }

      if (colSpannedFrom + colSpanCell.colSpan - 1 >= insertAt) {
        // extend the colSpanned cell
        Transforms.setNodes<CellElement>(
          editor,
          {
            colSpan: colSpanCell.colSpan + 1,
          },
          {
            at: [tableIdx, rowIdx, colSpannedFrom],
          }
        );
      }
    }

    Transforms.insertNodes(editor, newCell, {
      at: [tableIdx, rowIdx, insertAt],
    });
  }
};
