import { TableElement } from "../table-types";

// span root must be the top-left cell of the spanned area
export const findSpanRootLocation = (
  tableNode: TableElement,
  currentLocation: [number, number]
): [number, number] | null => {
  if (currentLocation.length !== 2) {
    // malformed target
    console.error("currentLocation is malformed", currentLocation);

    return null;
  }

  const cell =
    tableNode.children[currentLocation[0]]?.children[currentLocation[1]];

  if (!cell) {
    return null;
  }

  if (cell.rowSpan > 0 && cell.colSpan > 0) {
    return currentLocation;
  }

  if (cell.rowSpan > 0 || cell.colSpan > 0) {
    // malformed, should not happen
    console.error("cell is spanned but not a root cell", cell);

    return null;
  }

  // the rowSpan and colSpan are both 0 here
  // root of spanned cell must be the top-left cell of the spanned area
  // so traversing the table of the left-up part of the table from the current cell
  for (let row = currentLocation[0]; row >= 0; row--) {
    for (let col = currentLocation[1]; col >= 0; col--) {
      const checkCell = tableNode.children[row]?.children[col];

      if (!checkCell) {
        // malformed, should not happen
        console.error("cell is not found", tableNode, currentLocation);

        return null;
      }

      if (
        checkCell.rowSpan > 0 &&
        checkCell.colSpan > 0 &&
        row + checkCell.rowSpan > currentLocation[0] &&
        col + checkCell.colSpan > currentLocation[1]
      ) {
        return [row, col];
      }
    }
  }

  return null;
};
