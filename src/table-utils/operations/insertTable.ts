import { Editor, Transforms } from "slate";
import { isBlockActive } from "../../common-utils";
import { initTable } from "../initTableElements";

export const insertTable = (editor: Editor) => {
  const isActive = isBlockActive(editor, "table");

  if (isActive) {
    return;
  }

  const table = initTable({ rows: 3, cols: 3 });
  Transforms.insertNodes(editor, table);
};
