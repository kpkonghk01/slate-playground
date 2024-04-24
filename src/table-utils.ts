import { Editor, Element, Point, Range, Transforms } from "slate";
import { isBlockActive } from "./common-utils";
import { ReactEditor } from "slate-react";

export const withTables = (editor: ReactEditor) => {
  const { deleteBackward, deleteForward, normalizeNode } = editor;

  editor.deleteBackward = (unit) => {
    // copy from slate table example
    const { selection } = editor;

    if (selection && Range.isCollapsed(selection)) {
      const [cell] = Editor.nodes(editor, {
        match: (n) =>
          !Editor.isEditor(n) &&
          Element.isElement(n) &&
          // @ts-ignore
          n.type === "table-cell",
      });

      if (cell) {
        const [, cellPath] = cell;
        const start = Editor.start(editor, cellPath);

        if (Point.equals(selection.anchor, start)) {
          return;
        }
      }
    }

    deleteBackward(unit);
  };

  editor.deleteForward = (unit) => {
    // copy from slate table example
    const { selection } = editor;

    if (selection && Range.isCollapsed(selection)) {
      const [cell] = Editor.nodes(editor, {
        match: (n) =>
          !Editor.isEditor(n) &&
          Element.isElement(n) &&
          // @ts-ignore
          n.type === "table-cell",
      });

      if (cell) {
        const [, cellPath] = cell;
        const end = Editor.end(editor, cellPath);

        if (Point.equals(selection.anchor, end)) {
          return;
        }
      }
    }

    deleteForward(unit);
  };

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

      normalizeNode(entry);
    }
  };

  return editor;
};

export const toggleTable = (editor: Editor) => {
  const isActive = isBlockActive(editor, "table");

  if (isActive) {
    return;
  }

  const table = initTable({ rows: 3, cols: 3 });
  Transforms.insertNodes(editor, table);
};

export const initCell = () => {
  const col = {
    type: "table-cell",
    rowSpan: 1,
    colSpan: 1,
    children: [
      {
        // @ts-ignore
        type: "paragraph",
        children: [{ text: "" }],
      },
    ],
  };

  return col;
};

export const initRow = (cols: number) => {
  const row = {
    type: "table-row",
    children: [],
  };

  for (let j = 0; j < cols; j++) {
    // @ts-ignore
    row.children.push(initCell());
  }

  return row;
};

export const initTable = ({
  rows = 3,
  cols = 3,
}: {
  rows?: number;
  cols?: number;
}) => {
  const table = {
    type: "table",
    // colWidths: [],
    // rowHights: [],
    children: [],
  };

  for (let i = 0; i < rows; i++) {
    // @ts-ignore
    table.children.push(initRow(cols));
  }

  return table;
};
