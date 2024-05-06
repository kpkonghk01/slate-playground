"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitCell = void 0;
const slate_1 = require("slate");
const getTableInfo_1 = require("../queries/getTableInfo");
const splitCell = (editor, target) => {
    const [tableIdx, rowIdx, colIdx] = target;
    const tableInfo = (0, getTableInfo_1.getTableInfo)(editor, tableIdx);
    if (!tableInfo) {
        // target is not inside a table
        return;
    }
    const { tableNode } = tableInfo;
    const targetCell = tableNode.children[rowIdx]?.children[colIdx];
    if (!targetCell) {
        // malformed target
        console.error("Invalid target cell", tableNode, target);
        return;
    }
    const { rowSpan, colSpan } = targetCell;
    if (rowSpan <= 1 && colSpan <= 1) {
        // single cell
        return;
    }
    // split the cell
    for (let i = rowIdx; i < rowIdx + rowSpan; i++) {
        for (let j = colIdx; j < colIdx + colSpan; j++) {
            // reset rowSpan and colSpan for all spanned cells
            slate_1.Transforms.setNodes(editor, {
                rowSpan: 1,
                colSpan: 1,
            }, { at: [tableIdx, i, j] });
        }
    }
};
exports.splitCell = splitCell;
