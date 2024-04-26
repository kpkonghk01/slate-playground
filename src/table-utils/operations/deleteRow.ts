import { Editor, Transforms } from "slate";
import { getTableInfo } from "../getTableInfo";

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

  if (deleteAt < 0 || deleteAt >= tableInfo.numberOfRows) {
    // out of range
    return;
  }

  Transforms.removeNodes(editor, { at: target });
};
