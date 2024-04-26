import { Editor, Transforms } from "slate";
import { getTableInfo } from "../getTableInfo";

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

  for (let rowIdx = 0; rowIdx < tableInfo.numberOfRows; rowIdx++) {
    Transforms.removeNodes(editor, { at: [tableIdx, rowIdx, deleteAt] });
  }
};
