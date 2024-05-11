import { Editor, Transforms } from "slate";
import { ReactEditor } from "slate-react";

export const withNormalizeTable = (editor: ReactEditor) => {
  const { normalizeNode } = editor;

  editor.normalizeNode = (entry) => {
    // edit from ref: https://github.dev/udecode/plate/blob/main/packages/table/src/withNormalizeTable.ts
    const [node, path] = entry;

    // @ts-ignore
    if (node.type === "table") {
      const tableEntry = Editor.above(editor, {
        at: path,
        // @ts-ignore
        match: (node) => node.type === "table",
      });

      if (tableEntry) {
        // remove table parent of a table
        Transforms.unwrapNodes(editor, {
          at: path,
        });
        return;
      }

      // const initialTableWidth = 630; // full width of an element in cms
      // // @ts-ignore
      // const tableNode = node;
      // const colCount = (
      //       // @ts-ignore
      //   tableNode.children[0]?.children
      // )?.length;

      // if (colCount) {
      //   const colSizes: number[] = [];

      //   if (!tableNode.data.colSizes) {
      //     for (let i = 0; i < colCount; i++) {
      //       colSizes.push(initialTableWidth / colCount);
      //     }
      //   } else if (tableNode.data.colSizes.some((size) => !size)) {
      //     tableNode.data.colSizes.forEach((colSize) => {
      //       colSizes.push(colSize || initialTableWidth / colCount);
      //     });
      //   }

      //   if (colSizes.length > 0) {
      //     Transforms.setNodes(
      //       editor,
      //       { data: { ...tableNode.data, colSizes } },
      //       { at: path }
      //     );
      //     return;
      //   }
      // }
    }

    // @ts-ignore
    if (node.type === "table-row") {
      const parentEntry = Editor.parent(editor, path);

      if (
        // @ts-ignore
        parentEntry?.[0].type !== "table"
      ) {
        // remove non table parent of tr
        Transforms.unwrapNodes(editor, {
          at: path,
        });
        return;
      }
    }

    // @ts-ignore
    if (node.type === "table-cell") {
      const parentEntry = Editor.parent(editor, path);

      if (
        // @ts-ignore
        parentEntry?.[0].type !== "table-row"
      ) {
        // remove non tr parent of td
        Transforms.unwrapNodes(editor, {
          at: path,
        });
        return;
      }
    }

    normalizeNode(entry);
  };

  return editor;
};
