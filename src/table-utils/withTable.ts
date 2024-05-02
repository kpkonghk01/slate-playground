import { ReactEditor } from "slate-react";
import {
  withDeleteTableBackward,
  withDeleteTableForward,
} from "./withDeleteTable";
import { withNormalizeTable } from "./withNormalizeTable";
import { withInsertTextInTable } from "./withInsertTextInTable";

export const withTable = (editor: ReactEditor) => {
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
