"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCol = void 0;
const slate_1 = require("slate");
const getTableInfo_1 = require("../queries/getTableInfo");
const getSpannedRowIndexesOfCol_1 = require("../queries/getSpannedRowIndexesOfCol");
const findSpanRootLocation_1 = require("../queries/findSpanRootLocation");
const deleteCol = (editor, target) => {
    if (target.length !== 2) {
        // malformed target
        return;
    }
    const [tableIdx, deleteAt] = target;
    const tableInfo = (0, getTableInfo_1.getTableInfo)(editor, tableIdx);
    if (!tableInfo) {
        // target is not inside a table
        return;
    }
    const { tableNode, numberOfRows, numberOfCols } = tableInfo;
    if (deleteAt < 0 || deleteAt >= numberOfCols) {
        // out of range
        return;
    }
    if (tableInfo.numberOfCols === 1) {
        // cannot delete the last col
        return;
    }
    // decrement colSpan of cells that span over the deleted col
    const colSpannedAt = (0, getSpannedRowIndexesOfCol_1.getSpannedRowIndexesOfCol)(tableNode, deleteAt);
    for (let rowIdx = 0; rowIdx < numberOfRows; rowIdx++) {
        breakCondition: if (colSpannedAt.has(rowIdx)) {
            const spanRootAt = (0, findSpanRootLocation_1.findSpanRootLocation)(tableNode, [rowIdx, deleteAt]);
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
            if (colSpannedFrom + colSpanCell.colSpan > deleteAt) {
                // decrement the colSpanned cell
                slate_1.Transforms.setNodes(editor, {
                    colSpan: colSpanCell.colSpan - 1,
                }, {
                    at: [tableIdx, rowIdx, colSpannedFrom],
                });
            }
        }
        else {
            // not a spanned cell, but may be a span root cell
            const spanRoot = tableNode.children[rowIdx]?.children[deleteAt];
            // move span root cells to the next col and decrement colSpan
            if (spanRoot && spanRoot.colSpan > 1) {
                // span root cell
                // move the content of the span root cell to the next col when deleting it
                slate_1.Transforms.moveNodes(editor, {
                    at: [tableIdx, rowIdx, deleteAt],
                    to: [tableIdx, rowIdx, deleteAt + 1],
                });
                // set span root cells to the next row and decrement rowSpan
                slate_1.Transforms.setNodes(editor, {
                    rowSpan: spanRoot.rowSpan,
                    colSpan: spanRoot.colSpan - 1,
                }, {
                    at: [tableIdx, rowIdx, deleteAt + 1],
                });
            }
        }
        slate_1.Transforms.removeNodes(editor, { at: [tableIdx, rowIdx, deleteAt] });
    }
    slate_1.Transforms.setNodes(editor, {
        settings: {
            colSizes: [
                ...tableNode.settings.colSizes.slice(0, deleteAt),
                ...tableNode.settings.colSizes.slice(deleteAt + 1),
            ],
            rowSizes: tableNode.settings.rowSizes,
        },
    }, { at: [tableIdx] });
};
exports.deleteCol = deleteCol;
