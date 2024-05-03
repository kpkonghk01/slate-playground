import { Editor, Range, Transforms } from "slate";
import { ReactEditor } from "slate-react";
import { getSelectedTablePath } from "./queries/getSelectedTablePath";
import { getSelectedRange } from "./queries/getSelectedRange";

export const withSetTableFragmentData = (editor: ReactEditor) => {
  const { setFragmentData } = editor;

  editor.setFragmentData = (data, originEvent) => {
    const { selection } = editor;

    if (!selection) {
      // should not set anything when there is no selection
      return;
    }

    if (Range.isCollapsed(selection) || !originEvent) {
      setFragmentData(data, originEvent);

      return;
    }

    const tableRootPath = getSelectedTablePath(editor);

    if (tableRootPath == null) {
      // non selection table detected

      const cellsGenerator = Editor.nodes(editor, {
        at: selection,
        match: (n) => {
          // @ts-ignore
          return n.type === "table-cell";
        },
      });

      if (!cellsGenerator.next().done) {
        // cross table selection with table elements
        // collapse the selection to prevent insert text with cross selection
        Transforms.collapse(editor);

        // FIXME: even we prevent copy fragment data, the paste event is still triggered when drag

        return;
      }

      setFragmentData(data, originEvent);

      return;
    }

    // selection is inside a table
    const selectedRange = getSelectedRange(editor);

    if (!selectedRange) {
      setFragmentData(data, originEvent);

      return;
    }

    const onlyOneCellSelected =
      selectedRange[0][0] === selectedRange[1][0] &&
      selectedRange[0][1] === selectedRange[1][1];

    if (onlyOneCellSelected) {
      setFragmentData(data, originEvent);

      return;
    }

    // cross cells selection
    console.log("setFragmentData", data.items, originEvent);
    // TODO: handle cross cells copy/cut
  };

  return editor;
};
