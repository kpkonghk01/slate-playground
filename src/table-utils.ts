import { Editor, Element, Node, Path, Point, Range, Transforms } from "slate";
import { isBlockActive } from "./common-utils";
import { ReactEditor } from "slate-react";
import { CellsRange } from "./table-types";

const withDeleteTableBackward = (editor: ReactEditor) => {
  const { deleteBackward } = editor;

  editor.deleteBackward = (unit) => {
    console.log("deleteBackward");
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

  return editor;
};

const withDeleteTableForward = (editor: ReactEditor) => {
  const { deleteForward } = editor;

  editor.deleteForward = (unit) => {
    console.log("deleteForward");
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

  return editor;
};

const withNormalizeTable = (editor: ReactEditor) => {
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

      normalizeNode(entry);
    }
  };

  return editor;
};

const withInsertTextInTable = (editor: ReactEditor) => {
  const { insertText } = editor;

  editor.insertText = (text) => {
    const { selection } = editor;

    if (!selection) {
      // should not insert anything when there is no selection
      return;
    }

    if (Range.isCollapsed(selection)) {
      // not range selection
      // inset text to the focus
      insertText(text);

      return;
    }

    const selectedTablePath = getSelectedTablePath(editor);

    if (selectedTablePath === null) {
      // FIXME: the focus is not correct when the selection is backward, but Range.isBackward is always false, the selection looks always forward
      // plate.js has the same issue

      // selection is inside a table and cross cells
      // insert text to the focused cell
      insertText(text, { at: selection.focus });

      // reset the selection to the focus
      Transforms.select(editor, {
        anchor: selection.focus,
        focus: selection.focus,
      });

      return;
    }

    const cellsGenerator = Editor.nodes(editor, {
      at: selection,
      match: (n) => {
        // @ts-ignore
        return n.type === "table-cell";
      },
    });

    if (!cellsGenerator.next().done) {
      // cross table selection with non table elements
      // TODO: behavior TBD
      console.log(
        "unhandled case: cross table selection with non table elements"
      );

      return;
    }

    // no cell in the selection
    insertText(text);

    return;
  };

  return editor;
};

export const withTables = (editor: ReactEditor) => {
  // using their side effect to modify the editor, so don't need nested calls of withXXX
  [
    withDeleteTableBackward,
    withDeleteTableForward,
    withNormalizeTable,
    withInsertTextInTable,
  ].forEach((fn) => fn(editor));

  // FIXME: cross table setNodes does not work

  return editor;
};

export function getSelectedTablePath(editor: Editor): Path | null {
  const selection = editor.selection;

  if (!selection) {
    return null;
  }

  // copy from https://docs.slatejs.org/concepts/03-locations#path
  const range = Editor.unhangRange(editor, selection, { voids: true });

  let [common, path] = Node.common(editor, range.anchor.path, range.focus.path);

  const isEditor = Editor.isEditor(common);

  if (isEditor) {
    // when the selection crosses root elements
    return null;
  }

  // @ts-ignore
  if (common?.type !== "table" && common?.type !== "table-row") {
    return null;
  }

  return [path[0]!];
}

export const insertTable = (editor: Editor) => {
  const isActive = isBlockActive(editor, "table");

  if (isActive) {
    return;
  }

  const table = initTable({ rows: 3, cols: 3 });
  Transforms.insertNodes(editor, table);
};

// Assumption: no nested table
const getTableInfo = (editor: Editor, tableIdx: number) => {
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

  return { numberOfRows, numberOfCols };
};

// target should in the form of [tableIdxAtRoot, rowIdx]
export const insertRow = (editor: Editor, target: [number, number]) => {
  if (target.length !== 2) {
    // malformed target
    return;
  }

  const [tableIdx, insertAt] = target;
  const tableInfo = getTableInfo(editor, tableIdx);

  if (!tableInfo) {
    // target is not inside a table
    return;
  }

  if (insertAt < 0 || insertAt > tableInfo.numberOfRows) {
    // out of range
    return;
  }

  const newRow = initRow(tableInfo.numberOfCols);

  Transforms.insertNodes(editor, newRow, { at: target });
};

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

// target should in the form of [tableIdxAtRoot, colIdx]
export const insertCol = (editor: Editor, target: [number, number]) => {
  if (target.length !== 2) {
    // malformed target
    return;
  }

  const [tableIdx, insertAt] = target;
  const tableInfo = getTableInfo(editor, tableIdx);

  if (!tableInfo) {
    // target is not inside a table
    return;
  }

  if (insertAt < 0 || insertAt > tableInfo.numberOfCols) {
    // out of range
    return;
  }

  for (let rowIdx = 0; rowIdx < tableInfo.numberOfRows; rowIdx++) {
    const newCell = initCell();
    Transforms.insertNodes(editor, newCell, {
      at: [tableIdx, rowIdx, insertAt],
    });
  }
};

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

export const mergeCells = (
  editor: Editor,
  tableIdx: number,
  selectedRange: CellsRange | null
) => {
  if (!tableIdx || !selectedRange) {
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

  for (let colIdx = 0; colIdx < cols; colIdx++) {
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

  for (let rowIdx = 0; rowIdx < rows; rowIdx++) {
    // @ts-ignore
    table.children.push(initRow(cols));
  }

  return table;
};
