import { Editor, Node, NodeEntry, Transforms } from "slate";
import { CellElement, CellsRange } from "../../table-types";
import { getTableInfo } from "../getTableInfo";
import { initCell } from "../initTableElements";

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

  // Operations need to batched to avoid normalization in the middle of the operation
  Editor.withoutNormalizing(editor, () => {
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

        // remove the children content of the merged cells
        Transforms.removeNodes(editor, {
          at: [tableIdx, rowIdx, colIdx],
        });

        Transforms.insertNodes<CellElement>(
          editor,
          {
            ...initCell(),
            rowSpan: 0,
            colSpan: 0,
          } as NodeEntry<CellElement>[0],
          {
            at: [tableIdx, rowIdx, colIdx],
          }
        );
      }
    }

    // select the root of the merged cells, last "0, 0" is for focusing to the first text node of the first element in the cell
    // FIXME: not work as expected
    console.info(
      "expect the selection to be focused on the first cell after merge, but it becomes a range selection"
    );

    Transforms.select(
      editor,
      Editor.start(editor, [tableIdx, startRow, startCol, 0, 0])
    );
  });
};
