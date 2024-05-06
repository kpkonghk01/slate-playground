"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeCells = void 0;
const slate_1 = require("slate");
const getTableInfo_1 = require("../queries/getTableInfo");
const initTableElements_1 = require("../initTableElements");
const mergeCells = (editor, tableIdx, selectedRange) => {
    if (!Number.isInteger(tableIdx) || !editor.selection || !selectedRange) {
        // no selection
        return;
    }
    const tableInfo = (0, getTableInfo_1.getTableInfo)(editor, tableIdx);
    if (!tableInfo) {
        // target is not inside a table
        return;
    }
    const [[startRow, startCol], [endRow, endCol]] = selectedRange;
    if (startRow === endRow && startCol === endCol) {
        // no cell selected
        return;
    }
    // merge cells
    // Operations need to batched to avoid normalization in the middle of the operation
    slate_1.Editor.withoutNormalizing(editor, () => {
        for (let rowIdx = startRow; rowIdx <= endRow; rowIdx++) {
            for (let colIdx = startCol; colIdx <= endCol; colIdx++) {
                if (rowIdx === startRow && colIdx === startCol) {
                    slate_1.Transforms.setNodes(editor, {
                        rowSpan: endRow - startRow + 1,
                        colSpan: endCol - startCol + 1,
                    }, {
                        at: [tableIdx, rowIdx, colIdx],
                    });
                    // skip the first cell
                    continue;
                }
                // remove the children content of the merged cells
                slate_1.Transforms.removeNodes(editor, {
                    at: [tableIdx, rowIdx, colIdx],
                });
                slate_1.Transforms.insertNodes(editor, {
                    ...(0, initTableElements_1.initCell)(),
                    rowSpan: 0,
                    colSpan: 0,
                }, {
                    at: [tableIdx, rowIdx, colIdx],
                });
            }
        }
        // select the root of the merged cells, last "0, 0" is for focusing to the first text node of the first element in the cell
        // FIXME: not work as expected
        console.info("expect the selection to be focused on the first cell after merge, but it becomes a range selection");
        // Transforms.collapse(editor);
        slate_1.Transforms.select(editor, [tableIdx, startRow, startCol, 0, 0]);
    });
};
exports.mergeCells = mergeCells;
