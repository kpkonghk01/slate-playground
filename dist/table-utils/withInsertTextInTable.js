"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withInsertTextInTable = void 0;
const slate_1 = require("slate");
const getSelectedTablePath_1 = require("./queries/getSelectedTablePath");
const withInsertTextInTable = (editor) => {
    const { insertText } = editor;
    editor.insertText = (text) => {
        const { selection } = editor;
        if (!selection) {
            // should not insert anything when there is no selection
            return;
        }
        if (slate_1.Range.isCollapsed(selection)) {
            // not range selection
            // inset text to the focus
            insertText(text);
            return;
        }
        const tableRootPath = (0, getSelectedTablePath_1.getSelectedTablePath)(editor);
        if (tableRootPath !== null) {
            // non selection table detected
            // FIXME: the focus is not correct when the selection is backward, but Range.isBackward is always false, the selection looks always forward
            // plate.js has the same issue
            const anchorCellPath = selection.anchor.path.slice(0, 3);
            const focusCellPath = selection.focus.path.slice(0, 3);
            const onlyOneCellSelected = anchorCellPath.length === 3 &&
                focusCellPath.length === 3 &&
                slate_1.Path.equals(anchorCellPath, focusCellPath);
            if (onlyOneCellSelected) {
                insertText(text);
            }
            else {
                // selection is inside a table and cross cells
                // reset the selection to the focus
                slate_1.Transforms.select(editor, {
                    anchor: selection.focus,
                    focus: selection.focus,
                });
                // insert text to the focused cell
                insertText(text, { at: selection.focus });
            }
            return;
        }
        const cellsGenerator = slate_1.Editor.nodes(editor, {
            at: selection,
            match: (n) => {
                // @ts-ignore
                return n.type === "table-cell";
            },
        });
        if (!cellsGenerator.next().done) {
            // cross table selection with non table elements
            // TODO: behavior TBD
            // collapse the selection to prevent insert text with cross selection
            slate_1.Transforms.collapse(editor);
        }
        // no table in the selection
        insertText(text);
        return;
    };
    return editor;
};
exports.withInsertTextInTable = withInsertTextInTable;
