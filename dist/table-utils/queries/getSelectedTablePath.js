"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSelectedTablePath = void 0;
const slate_1 = require("slate");
function getSelectedTablePath(editor) {
    const selection = editor.selection;
    if (!selection) {
        return null;
    }
    // copy from https://docs.slatejs.org/concepts/03-locations#path
    const range = slate_1.Editor.unhangRange(editor, selection, { voids: true });
    // @ts-ignore
    const [tableAbove, path] = slate_1.Editor.above(editor, {
        at: range,
        // @ts-ignore
        match: (n) => n.type === "table",
    }) ?? [];
    if (!tableAbove || !path) {
        // when the selection crosses root elements
        return null;
    }
    return [path[0]];
}
exports.getSelectedTablePath = getSelectedTablePath;
