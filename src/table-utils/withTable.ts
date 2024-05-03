import { ReactEditor } from "slate-react";
import {
  withDeleteTableBackward,
  withDeleteTableForward,
  withDeleteTableFragment,
} from "./withDeleteTable";
import { withNormalizeTable } from "./withNormalizeTable";
import { withInsertTextInTable } from "./withInsertTextInTable";
import { withSetTableFragmentData } from "./withSetTableFragmentData";

export const withTable = (editor: ReactEditor) => {
  // using their side effect to modify the editor, so don't need nested calls of withXXX
  [
    withDeleteTableBackward,
    withDeleteTableForward,
    withNormalizeTable,
    withInsertTextInTable,
    withSetTableFragmentData,
    withDeleteTableFragment,
  ].forEach((fn) => fn(editor));

  // FIXME: cross table setNodes does not work
  const { insertData, insertFragmentData, insertTextData, addMark } = editor;

  editor.insertData = (data) => {
    console.log("insertData", data);
    return insertData(data);
  };

  editor.insertFragmentData = (data) => {
    // TODO
    console.log("insertFragmentData", data);
    return insertFragmentData(data);
  };

  editor.insertTextData = (data) => {
    console.log("insertTextData", data);
    return insertTextData(data);
  };

  editor.addMark = (key, value) => {
    // TODO
    console.log("addMark", key, value);
    return addMark(key, value);
  };

  return editor;
};
