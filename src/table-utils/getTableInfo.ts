import { Editor } from "slate";

// Assumption: no nested table
export const getTableInfo = (editor: Editor, tableIdx: number) => {
  const [tableNode] = Editor.node(editor, [tableIdx]);

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
