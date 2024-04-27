import { Editor, Transforms } from "slate";
import { getTableInfo } from "../getTableInfo";
import { getSpannedColIndexesOfRow } from "../getSpannedColIndexesOfRow";
import { findSpanRootLocation } from "../findSpanRootLocation";
import { CellElement } from "../../table-types";

export const deleteRow = (editor: Editor, target: [number, number]) => {
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

  const { tableNode, numberOfRows, numberOfCols } = tableInfo;

  if (deleteAt < 0 || deleteAt >= numberOfRows) {
    // out of range
    return;
  }

  if (numberOfRows === 1) {
    // cannot delete the last row
    return;
  }

  // decrement rowSpan of cells that span over the deleted row
  const rowSpannedAt = getSpannedColIndexesOfRow(tableNode, deleteAt);

  for (let colIdx = 0; colIdx < numberOfCols; colIdx++) {
    if (!rowSpannedAt.has(colIdx)) {
      const spanRoot = tableNode.children[deleteAt]?.children[colIdx];

      // not a spanned cell, but may be a span root cell
      // move span root cells to the next row and decrement rowSpan
      if (spanRoot && spanRoot.rowSpan > 1) {
        // span root cell
        Transforms.setNodes<CellElement>(
          editor,
          {
            rowSpan: spanRoot.rowSpan - 1,
            colSpan: spanRoot.colSpan,
          },
          {
            at: [tableIdx, deleteAt + 1, colIdx],
          }
        );
      }

      continue;
    }

    const spanRootAt = findSpanRootLocation(tableNode, [deleteAt, colIdx]);

    if (!spanRootAt) {
      // malformed table
      continue;
    }

    const [rowSpannedFrom] = spanRootAt;
    const rowSpanCell = tableNode.children[rowSpannedFrom]?.children[colIdx];

    if (!rowSpanCell) {
      // malformed table
      console.error("rowSpanCell not found", tableNode, [
        rowSpannedFrom,
        colIdx,
      ]);
      continue;
    }

    if (rowSpanCell.rowSpan === 0) {
      // boarder cell
      continue;
    }

    if (rowSpannedFrom + rowSpanCell.rowSpan - 1 >= deleteAt) {
      // decrement the rowSpanned cell
      Transforms.setNodes<CellElement>(
        editor,
        {
          rowSpan: rowSpanCell.rowSpan - 1,
        },
        {
          at: [tableIdx, rowSpannedFrom, colIdx],
        }
      );
    }
  }

  Transforms.removeNodes(editor, { at: target });
};
