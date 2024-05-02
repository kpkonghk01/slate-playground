"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withTable = void 0;
const withDeleteTable_1 = require("./withDeleteTable");
const withNormalizeTable_1 = require("./withNormalizeTable");
const withInsertTextInTable_1 = require("./withInsertTextInTable");
const withTable = (editor) => {
    // using their side effect to modify the editor, so don't need nested calls of withXXX
    [
        withDeleteTable_1.withDeleteTableBackward,
        withDeleteTable_1.withDeleteTableForward,
        withNormalizeTable_1.withNormalizeTable,
        withInsertTextInTable_1.withInsertTextInTable,
    ].forEach((fn) => fn(editor));
    // FIXME: cross table setNodes does not work
    return editor;
};
exports.withTable = withTable;
