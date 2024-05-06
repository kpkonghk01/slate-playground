import { Path, Range } from "slate";
import { ReactEditor } from "slate-react";
import { CellsRange } from "../../table-types";
import { getSelectedTablePath } from "./getSelectedTablePath";
import { normalizeSelectedRange } from "../normalizeSelectedRange";
import { getTableInfo } from "./getTableInfo";
import { expandSelectedRange } from "../expandSelectedRange";

export const getSelectedRange = (editor: ReactEditor): CellsRange | null => {
  const { selection } = editor;

  if (!selection) {
    return null;
  }

  // edges must be forward direction of selection
  const [startPoint, endPoint] = Range.edges(selection); // equals to `Editor.edges(editor, selection)`
  const tableRootPath = getSelectedTablePath(editor);

  // Assumption: no nested table
  if (tableRootPath == null) {
    // when the selection is inside a cell

    return null;
  }

  let startPath = startPoint.path;
  let endPath = endPoint.path;

  const tableInfo = getTableInfo(editor, tableRootPath[0]!);

  if (!tableInfo) {
    // should not happen

    return null;
  }

  {
    // to prevent the selection edge is outside the table
    if (startPath[0] !== tableRootPath[0]) {
      // set start path to the first cell of the table
      startPath = tableRootPath.concat([0, 0]);
    }

    if (endPath[0] !== tableRootPath[0]) {
      // set end path to the last cell of the table
      endPath = tableRootPath.concat([
        tableInfo.numberOfRows - 1,
        tableInfo.numberOfCols - 1,
      ]);
    }
  }

  const selectedRange: CellsRange = [
    Path.relative(startPath, tableRootPath).slice(0, 2) as CellsRange[number],
    Path.relative(endPath, tableRootPath).slice(0, 2) as CellsRange[number],
  ];

  // normalize selection range, ensure the selection is from the top-left corner to the bottom-right corner
  let normalizedSelectedRange: CellsRange =
    normalizeSelectedRange(selectedRange);

  const [[startRow, startCol], [endRow, endCol]] = normalizedSelectedRange;

  if (startRow === endRow && startCol === endCol) {
    // only one cell selected
    return null;
  }

  normalizedSelectedRange = expandSelectedRange(
    normalizedSelectedRange,
    tableInfo,
  );

  return normalizedSelectedRange;
};
