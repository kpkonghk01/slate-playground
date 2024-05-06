"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSelectedRange = void 0;
const slate_1 = require("slate");
const getSelectedTablePath_1 = require("./getSelectedTablePath");
const normalizeSelectedRange_1 = require("../normalizeSelectedRange");
const getTableInfo_1 = require("./getTableInfo");
const expandSelectedRange_1 = require("../expandSelectedRange");
const getSelectedRange = (editor) => {
    const { selection } = editor;
    if (!selection) {
        return null;
    }
    // edges must be forward direction of selection
    const [startPoint, endPoint] = slate_1.Range.edges(selection); // equals to `Editor.edges(editor, selection)`
    const tableRootPath = (0, getSelectedTablePath_1.getSelectedTablePath)(editor);
    // Assumption: no nested table
    if (tableRootPath == null) {
        // when the selection is inside a cell
        return null;
    }
    let startPath = startPoint.path;
    let endPath = endPoint.path;
    const tableInfo = (0, getTableInfo_1.getTableInfo)(editor, tableRootPath[0]);
    if (!tableInfo) {
        // should not happen
        return null;
    }
    {
        // to prevent the selection edge is outside the table
        if (startPath[0] !== tableRootPath[0]) {
            // set start path to the first cell of the table
            startPath = tableRootPath.concat([0, 0]);
        }
        if (endPath[0] !== tableRootPath[0]) {
            // set end path to the last cell of the table
            endPath = tableRootPath.concat([
                tableInfo.numberOfRows - 1,
                tableInfo.numberOfCols - 1,
            ]);
        }
    }
    const selectedRange = [
        slate_1.Path.relative(startPath, tableRootPath).slice(0, 2),
        slate_1.Path.relative(endPath, tableRootPath).slice(0, 2),
    ];
    // normalize selection range, ensure the selection is from the top-left corner to the bottom-right corner
    let normalizedSelectedRange = (0, normalizeSelectedRange_1.normalizeSelectedRange)(selectedRange);
    const [[startRow, startCol], [endRow, endCol]] = normalizedSelectedRange;
    if (startRow === endRow && startCol === endCol) {
        // only one cell selected
        return null;
    }
    normalizedSelectedRange = (0, expandSelectedRange_1.expandSelectedRange)(normalizedSelectedRange, tableInfo);
    return normalizedSelectedRange;
};
exports.getSelectedRange = getSelectedRange;
