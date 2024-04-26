import { Editor, Range, Transforms } from "slate";
import { ReactEditor } from "slate-react";
import { getSelectedTablePath } from "./getSelectedTablePath";

export const withInsertTextInTable = (editor: ReactEditor) => {
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
