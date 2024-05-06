"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findSpanCornerLocation = void 0;
const findSpanRootLocation_1 = require("./findSpanRootLocation");
// corner must be the bottom-right cell of the spanned area
const findSpanCornerLocation = (tableNode, currentLocation) => {
    const spanRootAt = (0, findSpanRootLocation_1.findSpanRootLocation)(tableNode, currentLocation);
    if (!spanRootAt) {
        return null;
    }
    const spanRoot = tableNode.children[spanRootAt[0]]?.children[spanRootAt[1]];
    if (!spanRoot) {
        return null;
    }
    return [
        spanRootAt[0] + spanRoot.rowSpan - 1,
        spanRootAt[1] + spanRoot.colSpan - 1,
    ];
};
exports.findSpanCornerLocation = findSpanCornerLocation;
