import { CellsRange } from "../table-types";

export const normalizeSelectedRange = (selectedRange: CellsRange) => {
  const normalizedSelectedRange: CellsRange = [
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
