import { Editor, Transforms } from "slate";
import { CellElement, CellsRange } from "../../table-types";
import { getTableInfo } from "../getTableInfo";

export const mergeCells = (
  editor: Editor,
  tableIdx: number,
  selectedRange: CellsRange | null
) => {
  if (!Number.isInteger(tableIdx) || !selectedRange) {
    // no selection
    return;
  }

  const tableInfo = getTableInfo(editor, tableIdx);

  if (!tableInfo) {
    // target is not inside a table
    return;
  }

  const [[startRow, startCol], [endRow, endCol]] = selectedRange;

  if (startRow === endRow && startCol === endCol) {
    // no cell selected
    return;
  }

  // merge cells
  for (let rowIdx = startRow; rowIdx <= endRow; rowIdx++) {
    for (let colIdx = startCol; colIdx <= endCol; colIdx++) {
      if (rowIdx === startRow && colIdx === startCol) {
        Transforms.setNodes<CellElement>(
          editor,
          {
            rowSpan: endRow - startRow + 1,
            colSpan: endCol - startCol + 1,
          },
          {
            at: [tableIdx, rowIdx, colIdx],
          }
        );

        // skip the first cell
        continue;
      }

      Transforms.setNodes<CellElement>(
        editor,
        {
          rowSpan: 0,
          colSpan: 0,
        },
        {
          at: [tableIdx, rowIdx, colIdx],
        }
      );
    }
  }
};
