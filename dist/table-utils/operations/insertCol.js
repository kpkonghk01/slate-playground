"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertCol = void 0;
const slate_1 = require("slate");
const initTableElements_1 = require("../initTableElements");
const getTableInfo_1 = require("../getTableInfo");
const findSpanRootLocation_1 = require("../findSpanRootLocation");
const getSpannedRowIndexesOfCol_1 = require("../getSpannedRowIndexesOfCol");
const table_constants_1 = require("../../table-constants");
// target should in the form of [tableIdxAtRoot, colIdx]
const insertCol = (editor, target) => {
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
    if (insertAt < 0 || insertAt > numberOfCols) {
        // out of range
        return;
    }
    const colSpannedAt = (0, getSpannedRowIndexesOfCol_1.getSpannedRowIndexesOfCol)(tableNode, insertAt);
    for (let rowIdx = 0; rowIdx < numberOfRows; rowIdx++) {
        const newCell = (0, initTableElements_1.initCell)();
        breakCondition: if (colSpannedAt.has(rowIdx)) {
            newCell.rowSpan = 0;
            newCell.colSpan = 0;
            // extend the colSpanned cell
            const spanRootAt = (0, findSpanRootLocation_1.findSpanRootLocation)(tableNode, [rowIdx, insertAt]);
            if (!spanRootAt) {
                // malformed table
                break breakCondition;
            }
            const [, colSpannedFrom] = spanRootAt;
            const colSpanCell = tableNode.children[rowIdx]?.children[colSpannedFrom];
            if (!colSpanCell) {
                // malformed table
                console.error("colSpanCell not found", tableNode, [
                    rowIdx,
                    colSpannedFrom,
                ]);
                break breakCondition;
            }
            if (colSpanCell.colSpan === 0) {
                // border cell
                break breakCondition;
            }
            if (colSpannedFrom + colSpanCell.colSpan - 1 >= insertAt) {
                // extend the colSpanned cell
                slate_1.Transforms.setNodes(editor, {
                    colSpan: colSpanCell.colSpan + 1,
                }, {
                    at: [tableIdx, rowIdx, colSpannedFrom],
                });
            }
        }
        slate_1.Transforms.insertNodes(editor, newCell, {
            at: [tableIdx, rowIdx, insertAt],
        });
    }
    slate_1.Transforms.setNodes(editor, {
        settings: {
            colSizes: [
                ...tableNode.settings.colSizes.slice(0, insertAt),
                table_constants_1.DefaultCellWidth,
                ...tableNode.settings.colSizes.slice(insertAt),
            ],
            rowSizes: tableNode.settings.rowSizes,
        },
    }, { at: [tableIdx] });
};
exports.insertCol = insertCol;
