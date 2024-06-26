import { Editor, Transforms } from "slate";
import { getTableInfo } from "../queries/getTableInfo";
import { getSpannedRowIndexesOfCol } from "../queries/getSpannedRowIndexesOfCol";
import { CellElement, TableElement } from "../../table-types";
import { findSpanRootLocation } from "../queries/findSpanRootLocation";

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

  const { tableNode, numberOfRows, numberOfCols } = tableInfo;

  if (deleteAt < 0 || deleteAt >= numberOfCols) {
    // out of range
    return;
  }

  if (tableInfo.numberOfCols === 1) {
    // cannot delete the last col
    return;
  }

  // decrement colSpan of cells that span over the deleted col
  const colSpannedAt = getSpannedRowIndexesOfCol(tableNode, deleteAt);

  for (let rowIdx = 0; rowIdx < numberOfRows; rowIdx++) {
    breakCondition: if (colSpannedAt.has(rowIdx)) {
      const spanRootAt = findSpanRootLocation(tableNode, [rowIdx, deleteAt]);

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

      if (colSpannedFrom + colSpanCell.colSpan > deleteAt) {
        // decrement the colSpanned cell
        Transforms.setNodes<CellElement>(
          editor,
          {
            colSpan: colSpanCell.colSpan - 1,
          },
          {
            at: [tableIdx, rowIdx, colSpannedFrom],
          },
        );
      }
    } else {
      // not a spanned cell, but may be a span root cell
      const spanRoot = tableNode.children[rowIdx]?.children[deleteAt];

      // move span root cells to the next col and decrement colSpan
      if (spanRoot && spanRoot.colSpan > 1) {
        // span root cell
        // move the content of the span root cell to the next col when deleting it
        Transforms.moveNodes(editor, {
          at: [tableIdx, rowIdx, deleteAt],
          to: [tableIdx, rowIdx, deleteAt + 1],
        });

        // set span root cells to the next row and decrement rowSpan
        Transforms.setNodes<CellElement>(
          editor,
          {
            rowSpan: spanRoot.rowSpan,
            colSpan: spanRoot.colSpan - 1,
          },
          {
            at: [tableIdx, rowIdx, deleteAt + 1],
          },
        );
      }
    }

    Transforms.removeNodes(editor, { at: [tableIdx, rowIdx, deleteAt] });
  }

  Transforms.setNodes<TableElement>(
    editor,
    {
      settings: {
        colSizes: [
          ...tableNode.settings.colSizes.slice(0, deleteAt),
          ...tableNode.settings.colSizes.slice(deleteAt + 1),
        ],
        rowSizes: tableNode.settings.rowSizes,
      },
    },
    { at: [tableIdx] },
  );
};
