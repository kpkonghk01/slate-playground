"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertTable = void 0;
const slate_1 = require("slate");
const common_utils_1 = require("../../common-utils");
const initTableElements_1 = require("../initTableElements");
const insertTable = (editor) => {
    const isActive = (0, common_utils_1.isBlockActive)(editor, "table");
    if (isActive) {
        return;
    }
    const table = (0, initTableElements_1.initTable)({ rows: 3, cols: 3 });
    slate_1.Transforms.insertNodes(editor, table);
};
exports.insertTable = insertTable;
