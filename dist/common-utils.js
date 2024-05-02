"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBlockActive = void 0;
const slate_1 = require("slate");
const isBlockActive = (editor, format, blockType = "type") => {
    const { selection } = editor;
    if (!selection)
        return false;
    const [match] = Array.from(slate_1.Editor.nodes(editor, {
        at: slate_1.Editor.unhangRange(editor, selection),
        match: (n) => !slate_1.Editor.isEditor(n) &&
            slate_1.Element.isElement(n) &&
            // @ts-ignore
            n[blockType] === format,
    }));
    return !!match;
};
exports.isBlockActive = isBlockActive;
