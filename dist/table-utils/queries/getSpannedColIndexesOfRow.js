"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSpannedColIndexesOfRow = void 0;
const getSpannedColIndexesOfRow = (tableNode, rowIdx) => {
    const rowSpannedAt = new Set();
    const numberOfCols = tableNode.children[rowIdx]?.children.length;
    if (!numberOfCols) {
        // malformed table
        console.error("malformed table", tableNode, rowIdx);
        return rowSpannedAt;
    }
    for (let colIdx = 0; colIdx < numberOfCols; colIdx++) {
        // @ts-ignore
        const checkCell = tableNode.children[rowIdx].children[colIdx];
        if (checkCell.colSpan === 0) {
            rowSpannedAt.add(colIdx);
        }
        else {
            // skip colSpanned cells
            colIdx += checkCell.colSpan - 1;
        }
    }
    return rowSpannedAt;
};
exports.getSpannedColIndexesOfRow = getSpannedColIndexesOfRow;
