import { Editor, Transforms } from "slate";
import { initCell } from "../initTableElements";
import { getTableInfo } from "../getTableInfo";

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

  if (insertAt < 0 || insertAt > tableInfo.numberOfCols) {
    // out of range
    return;
  }

  const colSpannedAt = new Set<number>();

  for (let rowIdx = 0; rowIdx < tableInfo.numberOfRows; rowIdx++) {
    // @ts-ignore
    const checkCell = tableInfo.tableNode.children[rowIdx].children[insertAt];

    if (checkCell.rowSpan === 0) {
      colSpannedAt.add(rowIdx);
    } else {
      // skip rowSpanned cells
      rowIdx += checkCell.rowSpan - 1;
    }
  }

  for (let rowIdx = 0; rowIdx < tableInfo.numberOfRows; rowIdx++) {
    const newCell = initCell();

    if (colSpannedAt.has(rowIdx)) {
      newCell.rowSpan = 0;
      newCell.colSpan = 0;

      // extend the colSpanned cell
      let colSpannedFrom = insertAt - 1;

      while (colSpannedFrom >= 0) {
        const colSpanCell =
          // @ts-ignore
          tableInfo.tableNode.children[rowIdx].children[colSpannedFrom];

        if (colSpanCell.colSpan > 0) {
          if (colSpannedFrom + colSpanCell.colSpan - 1 >= insertAt) {
            // extend the colSpanned cell
            Transforms.setNodes(
              editor,
              {
                // @ts-ignore
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
