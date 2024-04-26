import { Editor, Transforms } from "slate";
import { CellsRange } from "../../table-types";
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
        Transforms.setNodes(
          editor,
          {
            // @ts-ignore
            rowSpan: endRow - startRow + 1,
            // @ts-ignore
            colSpan: endCol - startCol + 1,
          },
          {
            at: [tableIdx, rowIdx, colIdx],
          }
        );

        // skip the first cell
        continue;
      }

      Transforms.setNodes(
        editor,
        {
          // @ts-ignore
          rowSpan: 0,
          // @ts-ignore
          colSpan: 0,
        },
        {
          at: [tableIdx, rowIdx, colIdx],
        }
      );
    }
  }
};
