"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCell = exports.initRow = exports.initTable = void 0;
const table_constants_1 = require("../table-constants");
const initTable = ({ rows = 3, cols = 3, }) => {
    const table = {
        type: "table",
        settings: {
            colSizes: Array.from({ length: cols }, () => table_constants_1.DefaultCellWidth),
            rowSizes: Array.from({ length: rows }, () => table_constants_1.DefaultCellHeight),
        },
        children: [],
    };
    for (let rowIdx = 0; rowIdx < rows; rowIdx++) {
        // @ts-ignore
        table.children.push((0, exports.initRow)(cols));
    }
    return table;
};
exports.initTable = initTable;
const initRow = (cols) => {
    const row = {
        type: "table-row",
        children: [],
    };
    for (let colIdx = 0; colIdx < cols; colIdx++) {
        // @ts-ignore
        row.children.push((0, exports.initCell)());
    }
    return row;
};
exports.initRow = initRow;
const initCell = () => {
    const cell = {
        type: "table-cell",
        rowSpan: 1,
        colSpan: 1,
        children: [
            {
                // @ts-ignore
                type: "paragraph",
                children: [{ text: "" }],
            },
        ],
    };
    return cell;
};
exports.initCell = initCell;
