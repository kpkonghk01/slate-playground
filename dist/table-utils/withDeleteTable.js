"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withDeleteTableForward = exports.withDeleteTableBackward = void 0;
const slate_1 = require("slate");
const withDeleteTableBackward = (editor) => {
    const { deleteBackward } = editor;
    editor.deleteBackward = (unit) => {
        console.log("deleteBackward");
        // copy from slate table example
        const { selection } = editor;
        if (selection && slate_1.Range.isCollapsed(selection)) {
            const [cell] = slate_1.Editor.nodes(editor, {
                match: (n) => !slate_1.Editor.isEditor(n) &&
                    slate_1.Element.isElement(n) &&
                    // @ts-ignore
                    n.type === "table-cell",
            });
            if (cell) {
                const [, cellPath] = cell;
                const start = slate_1.Editor.start(editor, cellPath);
                if (slate_1.Point.equals(selection.anchor, start)) {
                    return;
                }
            }
        }
        deleteBackward(unit);
    };
    return editor;
};
exports.withDeleteTableBackward = withDeleteTableBackward;
const withDeleteTableForward = (editor) => {
    const { deleteForward } = editor;
    editor.deleteForward = (unit) => {
        console.log("deleteForward");
        // copy from slate table example
        const { selection } = editor;
        if (selection && slate_1.Range.isCollapsed(selection)) {
            const [cell] = slate_1.Editor.nodes(editor, {
                match: (n) => !slate_1.Editor.isEditor(n) &&
                    slate_1.Element.isElement(n) &&
                    // @ts-ignore
                    n.type === "table-cell",
            });
            if (cell) {
                const [, cellPath] = cell;
                const end = slate_1.Editor.end(editor, cellPath);
                if (slate_1.Point.equals(selection.anchor, end)) {
                    return;
                }
            }
        }
        deleteForward(unit);
    };
    return editor;
};
exports.withDeleteTableForward = withDeleteTableForward;
