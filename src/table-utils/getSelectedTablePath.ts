import { Editor, Node, Path } from "slate";

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
