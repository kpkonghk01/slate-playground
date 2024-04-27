import { TableElement } from "../table-types";
import { findSpanRootLocation } from "./findSpanRootLocation";

// corner must be the bottom-right cell of the spanned area
export const findSpanCornerLocation = (
  tableNode: TableElement,
  currentLocation: [number, number]
): [number, number] | null => {
  const spanRootAt = findSpanRootLocation(tableNode, currentLocation);

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
