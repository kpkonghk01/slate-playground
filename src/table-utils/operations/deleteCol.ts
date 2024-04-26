import { Editor, Transforms } from "slate";
import { getTableInfo } from "../getTableInfo";
import { getSpannedRowIndexesOfCol } from "../getSpannedRowIndexesOfCol";
import { CellElement } from "../../table-types";
import { findColIdxOfSpanRoot } from "../findSpanRootCell";

export const deleteCol = (editor: Editor, target: [number, number]) => {
  if (target.length !== 2) {
    // malformed target
    return;
  }

  const [tableIdx, deleteAt] = target;
  const tableInfo = getTableInfo(editor, tableIdx);

  if (!tableInfo) {
    // target is not inside a table
    return;
  }

  if (deleteAt < 0 || deleteAt >= tableInfo.numberOfCols) {
    // out of range
    return;
  }

  const { tableNode, numberOfRows, numberOfCols } = tableInfo;

  // decrement colSpan of cells that span over the deleted col
  const colSpannedAt = getSpannedRowIndexesOfCol(tableNode, deleteAt);

  for (let rowIdx = 0; rowIdx < tableInfo.numberOfRows; rowIdx++) {
    breakCondition: if (colSpannedAt.has(rowIdx)) {
      const colSpannedFrom = findColIdxOfSpanRoot(tableNode, [
        rowIdx,
        deleteAt,
      ]);

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
        // boarder cell
        break breakCondition;
      }

      if (colSpannedFrom + colSpanCell.colSpan - 1 > deleteAt) {
        // decrement the colSpanned cell
        Transforms.setNodes<CellElement>(
          editor,
          {
            colSpan: colSpanCell.colSpan - 1,
          },
          {
            at: [tableIdx, rowIdx, colSpannedFrom],
          }
        );
      }
    }

    Transforms.removeNodes(editor, { at: [tableIdx, rowIdx, deleteAt] });
  }
};
