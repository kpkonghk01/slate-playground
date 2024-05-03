import { Editor, NodeEntry } from "slate";
import { TableElement } from "../../table-types";

export type TableInfo = {
  tableNode: TableElement;
  numberOfRows: number;
  numberOfCols: number;
};

// Assumption: no nested table
export const getTableInfo = (
  editor: Editor,
  tableIdx: number,
): TableInfo | null => {
  const [tableNode] = Editor.node(editor, [
    tableIdx,
  ]) as NodeEntry<TableElement>;

  if (
    !tableNode ||
    // @ts-ignore
    tableNode.type !== "table"
  ) {
    return null;
  }

  // @ts-ignore
  const numberOfRows = tableNode.children.length;
  // @ts-ignore
  const numberOfCols = tableNode.children[0].children.length;

  return { tableNode, numberOfRows, numberOfCols };
};
