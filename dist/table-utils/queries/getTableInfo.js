"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTableInfo = void 0;
const slate_1 = require("slate");
// Assumption: no nested table
const getTableInfo = (editor, tableIdx) => {
    const [tableNode] = slate_1.Editor.node(editor, [
        tableIdx,
    ]);
    if (!tableNode ||
        // @ts-ignore
        tableNode.type !== "table") {
        return null;
    }
    // @ts-ignore
    const numberOfRows = tableNode.children.length;
    // @ts-ignore
    const numberOfCols = tableNode.children[0].children.length;
    return { tableNode, numberOfRows, numberOfCols };
};
exports.getTableInfo = getTableInfo;
