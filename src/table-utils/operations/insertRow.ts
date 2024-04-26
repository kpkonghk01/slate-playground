import { Editor, Transforms } from "slate";
import { CellElement } from "../../table-types";
import { initRow } from "../initTableElements";
import { getTableInfo } from "../getTableInfo";

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

  if (insertAt < 0 || insertAt > tableInfo.numberOfRows) {
    // out of range
    return;
  }

  const rowSpannedAt = new Set<number>();

  for (let colIdx = 0; colIdx < tableInfo.numberOfCols; colIdx++) {
    // @ts-ignore
    const checkCell = tableInfo.tableNode.children[insertAt].children[colIdx]!;

    if (checkCell.colSpan === 0) {
      rowSpannedAt.add(colIdx);
    } else {
      // skip colSpanned cells
      colIdx += checkCell.colSpan - 1;
    }
  }

  const newRow = initRow(tableInfo.numberOfCols);

  for (let colIdx = 0; colIdx < tableInfo.numberOfCols; colIdx++) {
    // existence is ensured by initRow
    const newCell = newRow.children[colIdx] as CellElement;

    if (rowSpannedAt.has(colIdx)) {
      newCell.rowSpan = 0;
      newCell.colSpan = 0;

      // extend the rowSpanned cell
      let rowSpannedFrom = insertAt - 1;

      while (rowSpannedFrom >= 0) {
        const rowSpanCell =
          tableInfo.tableNode.children[rowSpannedFrom]!.children[colIdx]!;

        if (rowSpanCell.rowSpan > 0) {
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

          break;
        }

        rowSpannedFrom--;
      }
    }
  }

  Transforms.insertNodes(editor, newRow, { at: target });
};
