"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRow = void 0;
const slate_1 = require("slate");
const getTableInfo_1 = require("../queries/getTableInfo");
const getSpannedColIndexesOfRow_1 = require("../queries/getSpannedColIndexesOfRow");
const findSpanRootLocation_1 = require("../queries/findSpanRootLocation");
const deleteRow = (editor, target) => {
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
    if (deleteAt < 0 || deleteAt >= numberOfRows) {
        // out of range
        return;
    }
    if (numberOfRows === 1) {
        // cannot delete the last row
        return;
    }
    // decrement rowSpan of cells that span over the deleted row
    const rowSpannedAt = (0, getSpannedColIndexesOfRow_1.getSpannedColIndexesOfRow)(tableNode, deleteAt);
    for (let colIdx = 0; colIdx < numberOfCols; colIdx++) {
        if (!rowSpannedAt.has(colIdx)) {
            // not a spanned cell, but may be a span root cell
            const spanRoot = tableNode.children[deleteAt]?.children[colIdx];
            if (spanRoot && spanRoot.rowSpan > 1) {
                // span root cell
                // move the content of the span root cell to the next row when deleting it
                slate_1.Transforms.moveNodes(editor, {
                    at: [tableIdx, deleteAt, colIdx],
                    to: [tableIdx, deleteAt + 1, colIdx],
                });
                // exchange the spanned cell below to the span root cell
                slate_1.Transforms.moveNodes(editor, {
                    at: [tableIdx, deleteAt + 1, colIdx + 1],
                    to: [tableIdx, deleteAt, colIdx],
                });
                // set span root cells to the next row and decrement rowSpan
                slate_1.Transforms.setNodes(editor, {
                    rowSpan: spanRoot.rowSpan - 1,
                    colSpan: spanRoot.colSpan,
                }, {
                    at: [tableIdx, deleteAt + 1, colIdx],
                });
            }
            continue;
        }
        const spanRootAt = (0, findSpanRootLocation_1.findSpanRootLocation)(tableNode, [deleteAt, colIdx]);
        if (!spanRootAt) {
            // malformed table
            continue;
        }
        const [rowSpannedFrom] = spanRootAt;
        const rowSpanCell = tableNode.children[rowSpannedFrom]?.children[colIdx];
        if (!rowSpanCell) {
            // malformed table
            console.error("rowSpanCell not found", tableNode, [
                rowSpannedFrom,
                colIdx,
            ]);
            continue;
        }
        if (rowSpannedFrom + rowSpanCell.rowSpan > deleteAt) {
            // decrement the rowSpanned cell
            slate_1.Transforms.setNodes(editor, {
                rowSpan: rowSpanCell.rowSpan - 1,
            }, {
                at: [tableIdx, rowSpannedFrom, colIdx],
            });
        }
    }
    slate_1.Transforms.setNodes(editor, {
        settings: {
            colSizes: tableNode.settings.colSizes,
            rowSizes: [
                ...tableNode.settings.rowSizes.slice(0, deleteAt),
                ...tableNode.settings.rowSizes.slice(deleteAt + 1),
            ],
        },
    }, { at: [tableIdx] });
    slate_1.Transforms.removeNodes(editor, { at: target });
};
exports.deleteRow = deleteRow;
