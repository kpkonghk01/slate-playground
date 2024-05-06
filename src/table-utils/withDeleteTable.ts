import { Editor, Element, Point, Range, Transforms } from "slate";
import { ReactEditor } from "slate-react";
import { getSelectedTablePath } from "./queries/getSelectedTablePath";
import { CellElement } from "../table-types";
import { getTableInfo } from "./queries/getTableInfo";
import { initCell } from "./initTableElements";
import { getSelectedRange } from "./queries/getSelectedRange";

export const withDeleteTableBackward = (editor: ReactEditor) => {
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

export const withDeleteTableForward = (editor: ReactEditor) => {
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

// not used
export const withDeleteTable = (editor: ReactEditor) => {
  const { delete: deleteHook } = editor;

  editor.delete = (options) => {
    console.log("delete", options);
    // multi selection delete, cut after deleteFragment
    // also drag, but drag don't trigger deleteFragment

    // drag with multiple cells is forbidden in table, handled by `onMouseDown` in `TableElement`
    // drag with single cell is allowed
    deleteHook(options);
  };

  return editor;
};

export const withDeleteTableFragment = (editor: ReactEditor) => {
  const { deleteFragment } = editor;

  editor.deleteFragment = (options) => {
    // multi selection delete, cut

    const { selection } = editor;

    if (!selection) {
      // should not insert anything when there is no selection
      return;
    }

    if (Range.isCollapsed(selection)) {
      deleteFragment(options);

      return;
    }

    const tableRootPath = getSelectedTablePath(editor);

    if (tableRootPath == null) {
      // non table elements selected

      const cellsGenerator = Editor.nodes(editor, {
        at: selection,
        match: (n) => {
          // @ts-ignore
          return n.type === "table-cell";
        },
      });

      if (!cellsGenerator.next().done) {
        // cross table selection

        // collapse the selection to prevent insert text with cross selection
        Transforms.collapse(editor);
      }

      deleteFragment(options);

      return;
    }

    // selection is inside a table
    const selectedRange = getSelectedRange(editor);

    if (!selectedRange) {
      deleteFragment(options);

      return;
    }

    // customized delete for table with multi-cells selected
    // delete the selected range of cells
    const tableInfo = getTableInfo(editor, tableRootPath[0]!);

    if (!tableInfo) {
      // should not happen
      deleteFragment(options);

      return;
    }

    const { tableNode } = tableInfo;
    const [[startRow, startCol], [endRow, endCol]] = selectedRange;

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        // delete the cell
        const cellPath = tableRootPath.concat([row, col]);
        const cell = tableNode.children[row]!.children[col]!;

        Transforms.removeNodes(editor, {
          at: cellPath,
        });

        Transforms.insertNodes<CellElement>(
          editor,
          {
            ...initCell(),
            rowSpan: cell.rowSpan ?? 1,
            colSpan: cell.colSpan ?? 1,
          } as CellElement,
          {
            at: cellPath,
          },
        );
      }
    }

    // last "0, 0" is for focusing to the first text node of the first element in the cell
    Transforms.select(editor, {
      anchor: {
        path: tableRootPath.concat([startRow, startCol, 0, 0]),
        offset: 0,
      },
      focus: {
        path: tableRootPath.concat([endRow, endCol, 0, 0]),
        offset: 0,
      },
    });
  };

  return editor;
};
