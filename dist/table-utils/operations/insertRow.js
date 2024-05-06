"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertRow = void 0;
const slate_1 = require("slate");
const initTableElements_1 = require("../initTableElements");
const getTableInfo_1 = require("../queries/getTableInfo");
const findSpanRootLocation_1 = require("../queries/findSpanRootLocation");
const getSpannedColIndexesOfRow_1 = require("../queries/getSpannedColIndexesOfRow");
// target should in the form of [tableIdxAtRoot, rowIdx]
const insertRow = (editor, target) => {
    if (target.length !== 2) {
        // malformed target
        return;
    }
    const [tableIdx, insertAt] = target;
    const tableInfo = (0, getTableInfo_1.getTableInfo)(editor, tableIdx);
    if (!tableInfo) {
        // target is not inside a table
        return;
    }
    const { tableNode, numberOfRows, numberOfCols } = tableInfo;
    if (insertAt < 0 || insertAt > numberOfRows) {
        // out of range
        return;
    }
    const rowSpannedAt = (0, getSpannedColIndexesOfRow_1.getSpannedColIndexesOfRow)(tableNode, insertAt);
    const newRow = (0, initTableElements_1.initRow)(numberOfCols);
    for (let colIdx = 0; colIdx < numberOfCols; colIdx++) {
        // existence is ensured by initRow
        const newCell = newRow.children[colIdx];
        if (!rowSpannedAt.has(colIdx)) {
            continue;
        }
        newCell.rowSpan = 0;
        newCell.colSpan = 0;
        // find the root span cell if it is in the same column
        const spanRootAt = (0, findSpanRootLocation_1.findSpanRootLocation)(tableNode, [insertAt, colIdx]);
        if (!spanRootAt) {
            // malformed table
            continue;
        }
        const [rowSpannedFrom] = spanRootAt;
        const rowSpanCell = tableNode.children[rowSpannedFrom].children[colIdx];
        if (rowSpanCell.rowSpan === 0) {
            continue;
        }
        if (rowSpannedFrom + rowSpanCell.rowSpan - 1 >= insertAt) {
            // extend the rowSpanned cell
            slate_1.Transforms.setNodes(editor, {
                rowSpan: rowSpanCell.rowSpan + 1,
            }, {
                at: [tableIdx, rowSpannedFrom, colIdx],
            });
        }
    }
    slate_1.Transforms.setNodes(editor, {
        settings: {
            colSizes: tableNode.settings.colSizes,
            rowSizes: [
                ...tableNode.settings.rowSizes.slice(0, insertAt),
                0,
                ...tableNode.settings.rowSizes.slice(insertAt),
            ],
        },
    }, { at: [tableIdx] });
    slate_1.Transforms.insertNodes(editor, newRow, { at: target });
};
exports.insertRow = insertRow;
