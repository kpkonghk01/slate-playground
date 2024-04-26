import { Editor, Transforms } from "slate";
import { initCell } from "../initTableElements";
import { getTableInfo } from "../getTableInfo";
import { CellElement } from "../../table-types";

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

  const colSpannedAt = new Set<number>();

  for (let rowIdx = 0; rowIdx < numberOfRows; rowIdx++) {
    const checkCell = tableNode.children[rowIdx]!.children[insertAt]!;

    if (checkCell.rowSpan === 0) {
      colSpannedAt.add(rowIdx);
    } else {
      // skip rowSpanned cells
      rowIdx += checkCell.rowSpan - 1;
    }
  }

  for (let rowIdx = 0; rowIdx < numberOfRows; rowIdx++) {
    const newCell = initCell();

    if (colSpannedAt.has(rowIdx)) {
      newCell.rowSpan = 0;
      newCell.colSpan = 0;

      // extend the colSpanned cell
      let colSpannedFrom = insertAt - 1;

      while (colSpannedFrom >= 0) {
        const colSpanCell =
          tableInfo.tableNode.children[rowIdx]!.children[colSpannedFrom]!;

        if (colSpanCell.colSpan > 0) {
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

          break;
        }

        colSpannedFrom--;
      }
    }

    Transforms.insertNodes(editor, newCell, {
      at: [tableIdx, rowIdx, insertAt],
    });
  }
};
