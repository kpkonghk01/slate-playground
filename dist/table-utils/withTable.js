"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withTable = void 0;
const withDeleteTable_1 = require("./withDeleteTable");
const withNormalizeTable_1 = require("./withNormalizeTable");
const withInsertTextInTable_1 = require("./withInsertTextInTable");
const withSetTableFragmentData_1 = require("./withSetTableFragmentData");
const withTable = (editor) => {
    // using their side effect to modify the editor, so don't need nested calls of withXXX
    [
        withDeleteTable_1.withDeleteTableBackward,
        withDeleteTable_1.withDeleteTableForward,
        withNormalizeTable_1.withNormalizeTable,
        withInsertTextInTable_1.withInsertTextInTable,
        withSetTableFragmentData_1.withSetTableFragmentData,
        withDeleteTable_1.withDeleteTableFragment,
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
exports.withTable = withTable;
