import { BaseEditor, Editor, Element } from "slate";

export const isBlockActive = (
  editor: BaseEditor,
  format: any,
  blockType = "type"
) => {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: (n) =>
        !Editor.isEditor(n) &&
        Element.isElement(n) &&
        // @ts-ignore
        n[blockType] === format,
    })
  );

  return !!match;
};
