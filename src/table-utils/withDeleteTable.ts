import { Editor, Element, Point, Range } from "slate";
import { ReactEditor } from "slate-react";

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
