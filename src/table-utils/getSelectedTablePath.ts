import { Editor, Path } from "slate";
import { TableElement } from "../table-types";

export function getSelectedTablePath(editor: Editor): Path | null {
  const selection = editor.selection;

  if (!selection) {
    return null;
  }

  // copy from https://docs.slatejs.org/concepts/03-locations#path
  const range = Editor.unhangRange(editor, selection, { voids: true });

  // @ts-ignore
  const [tableAbove, path] = Editor.above<TableElement>(editor, {
    at: range,
    // @ts-ignore
    match: (n) => n.type === "table",
  });

  if (!tableAbove) {
    // when the selection crosses root elements
    return null;
  }

  return [path[0]!];
}
