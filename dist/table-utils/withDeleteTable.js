"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withDeleteTableFragment = exports.withDeleteTable = exports.withDeleteTableForward = exports.withDeleteTableBackward = void 0;
const slate_1 = require("slate");
const getSelectedTablePath_1 = require("./queries/getSelectedTablePath");
const getTableInfo_1 = require("./queries/getTableInfo");
const initTableElements_1 = require("./initTableElements");
const getSelectedRange_1 = require("./queries/getSelectedRange");
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
// not used
const withDeleteTable = (editor) => {
    const { delete: deleteHook } = editor;
    editor.delete = (options) => {
        console.log("delete", options);
        // multi selection delete, cut after deleteFragment
        // also drag, but drag don't trigger deleteFragment
        // drag with multiple cells is forbidden in table, handled by `onMouseDown` in `TableElement`
        // drag with single cell is allowed
        deleteHook(options);
    };
    return editor;
};
exports.withDeleteTable = withDeleteTable;
const withDeleteTableFragment = (editor) => {
    const { deleteFragment } = editor;
    editor.deleteFragment = (options) => {
        // multi selection delete, cut
        const { selection } = editor;
        if (!selection) {
            // should not insert anything when there is no selection
            return;
        }
        if (slate_1.Range.isCollapsed(selection)) {
            deleteFragment(options);
            return;
        }
        const tableRootPath = (0, getSelectedTablePath_1.getSelectedTablePath)(editor);
        if (tableRootPath == null) {
            // non table elements selected
            const cellsGenerator = slate_1.Editor.nodes(editor, {
                at: selection,
                match: (n) => {
                    // @ts-ignore
                    return n.type === "table-cell";
                },
            });
            if (!cellsGenerator.next().done) {
                // cross table selection
                // collapse the selection to prevent insert text with cross selection
                slate_1.Transforms.collapse(editor);
            }
            deleteFragment(options);
            return;
        }
        // selection is inside a table
        const selectedRange = (0, getSelectedRange_1.getSelectedRange)(editor);
        if (!selectedRange) {
            deleteFragment(options);
            return;
        }
        // customized delete for table with multi-cells selected
        // delete the selected range of cells
        const tableInfo = (0, getTableInfo_1.getTableInfo)(editor, tableRootPath[0]);
        if (!tableInfo) {
            // should not happen
            deleteFragment(options);
            return;
        }
        const { tableNode } = tableInfo;
        const [[startRow, startCol], [endRow, endCol]] = selectedRange;
        for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
                // delete the cell
                const cellPath = tableRootPath.concat([row, col]);
                const cell = tableNode.children[row].children[col];
                slate_1.Transforms.removeNodes(editor, {
                    at: cellPath,
                });
                slate_1.Transforms.insertNodes(editor, {
                    ...(0, initTableElements_1.initCell)(),
                    rowSpan: cell.rowSpan ?? 1,
                    colSpan: cell.colSpan ?? 1,
                }, {
                    at: cellPath,
                });
            }
        }
        // last "0, 0" is for focusing to the first text node of the first element in the cell
        slate_1.Transforms.select(editor, tableRootPath.concat([startRow, startCol, 0, 0]));
    };
    return editor;
};
exports.withDeleteTableFragment = withDeleteTableFragment;
