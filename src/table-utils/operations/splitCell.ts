import { Editor, Transforms } from "slate";
import { getTableInfo } from "../queries/getTableInfo";
import { CellElement } from "../../table-types";

export const splitCell = (editor: Editor, target: [number, number, number]) => {
  const [tableIdx, rowIdx, colIdx] = target;
  const tableInfo = getTableInfo(editor, tableIdx);

  if (!tableInfo) {
    // target is not inside a table
    return;
  }

  const { tableNode } = tableInfo;

  const targetCell = tableNode.children[rowIdx]?.children[
    colIdx
  ] as CellElement;

  if (!targetCell) {
    // malformed target
    console.error("Invalid target cell", tableNode, target);
    return;
  }

  const { rowSpan, colSpan } = targetCell;

  if (rowSpan <= 1 && colSpan <= 1) {
    // single cell
    return;
  }

  // split the cell
  for (let i = rowIdx; i < rowIdx + rowSpan; i++) {
    for (let j = colIdx; j < colIdx + colSpan; j++) {
      // reset rowSpan and colSpan for all spanned cells
      Transforms.setNodes<CellElement>(
        editor,
        {
          rowSpan: 1,
          colSpan: 1,
        },
        { at: [tableIdx, i, j] },
      );
    }
  }
};
