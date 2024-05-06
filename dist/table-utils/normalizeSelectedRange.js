"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeSelectedRange = void 0;
const normalizeSelectedRange = (selectedRange) => {
    const normalizedSelectedRange = [
        [
            Math.min(selectedRange[0][0], selectedRange[1][0]),
            Math.min(selectedRange[0][1], selectedRange[1][1]),
        ],
        [
            Math.max(selectedRange[0][0], selectedRange[1][0]),
            Math.max(selectedRange[0][1], selectedRange[1][1]),
        ],
    ];
    return normalizedSelectedRange;
};
exports.normalizeSelectedRange = normalizeSelectedRange;
