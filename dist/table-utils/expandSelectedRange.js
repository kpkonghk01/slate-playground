"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expandSelectedRange = void 0;
const findSpanCornerLocation_1 = require("./queries/findSpanCornerLocation");
const findSpanRootLocation_1 = require("./queries/findSpanRootLocation");
const expandSelectedRange = (normalizedSelectedRange, tableInfo) => {
    const newRange = structuredClone(normalizedSelectedRange);
    const { tableNode, numberOfRows, numberOfCols } = tableInfo;
    // expand the range if any cell is merged at the border of the selected range
    let expansionDetected = false;
    // prevent infinite loop, just in case
    let breaker = 0;
    // limit the number of iterations, should cover all the cells in the table once
    let limit = 
    // table size
    numberOfRows * numberOfCols +
        // 4 corners are counted twice in each iteration below
        numberOfRows +
        numberOfCols;
    do {
        breaker++;
        expansionDetected = false;
        const [[startRow, startCol], [endRow, endCol]] = newRange;
        // expand vertically
        for (let row = startRow; row <= endRow; row++) {
            // extend the selected range with the root location of the spanned cell
            leftBorder: {
                const rootLocation = (0, findSpanRootLocation_1.findSpanRootLocation)(tableNode, [row, startCol]);
                if (!rootLocation) {
                    // impossible
                    console.error("rootLocation not found", tableNode, [row, startCol]);
                    break leftBorder;
                }
                if (rootLocation[0] === row && rootLocation[1] === startCol) {
                    // not a spanned cell
                    break leftBorder;
                }
                const newLocation = [
                    Math.min(newRange[0][0], rootLocation[0]),
                    Math.min(newRange[0][1], rootLocation[1]),
                ];
                if (newLocation[0] !== newRange[0][0] ||
                    newLocation[1] !== newRange[0][1]) {
                    newRange[0] = newLocation;
                    expansionDetected = true;
                }
            }
            rightBorder: {
                const cornerLocation = (0, findSpanCornerLocation_1.findSpanCornerLocation)(tableNode, [row, endCol]);
                if (!cornerLocation) {
                    // impossible
                    console.error("cornerLocation not found", tableNode, [row, endCol]);
                    break rightBorder;
                }
                if (cornerLocation[0] === row && cornerLocation[1] === endCol) {
                    // not a spanned cell
                    break rightBorder;
                }
                const newLocation = [
                    Math.max(newRange[1][0], cornerLocation[0]),
                    Math.max(newRange[1][1], cornerLocation[1]),
                ];
                if (newLocation[0] !== newRange[1][0] ||
                    newLocation[1] !== newRange[1][1]) {
                    newRange[1] = newLocation;
                    expansionDetected = true;
                }
            }
        }
        // expand horizontally
        for (let col = startCol; col <= endCol; col++) {
            topBorder: {
                const rootLocation = (0, findSpanRootLocation_1.findSpanRootLocation)(tableNode, [startRow, col]);
                if (!rootLocation) {
                    // impossible
                    console.error("rootLocation not found", tableNode, [startRow, col]);
                    break topBorder;
                }
                if (rootLocation[0] === startRow && rootLocation[1] === col) {
                    // not a spanned cell
                    break topBorder;
                }
                const newLocation = [
                    Math.min(newRange[0][0], rootLocation[0]),
                    Math.min(newRange[0][1], rootLocation[1]),
                ];
                if (newLocation[0] !== newRange[0][0] ||
                    newLocation[1] !== newRange[0][1]) {
                    newRange[0] = newLocation;
                    expansionDetected = true;
                }
            }
            bottomBorder: {
                const cornerLocation = (0, findSpanCornerLocation_1.findSpanCornerLocation)(tableNode, [endRow, col]);
                if (!cornerLocation) {
                    // impossible
                    console.error("cornerLocation not found", tableNode, [endRow, col]);
                    break bottomBorder;
                }
                if (cornerLocation[0] === endRow && cornerLocation[1] === col) {
                    // not a spanned cell
                    break bottomBorder;
                }
                const newLocation = [
                    Math.max(newRange[1][0], cornerLocation[0]),
                    Math.max(newRange[1][1], cornerLocation[1]),
                ];
                if (newLocation[0] !== newRange[1][0] ||
                    newLocation[1] !== newRange[1][1]) {
                    newRange[1] = newLocation;
                    expansionDetected = true;
                }
            }
        }
    } while (expansionDetected && breaker < limit);
    return newRange;
};
exports.expandSelectedRange = expandSelectedRange;
