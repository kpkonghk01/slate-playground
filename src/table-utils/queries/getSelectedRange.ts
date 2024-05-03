import { Editor, Path, Range } from "slate";
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

  // to prevent edge selection cross table's end
  const range = Editor.unhangRange(editor, selection, { voids: true });

  // edges must be forward direction of selection
  const [startPoint, endPoint] = Range.edges(range); // equals to `Editor.edges(editor, selection)`
  const tableRootPath = getSelectedTablePath(editor);

  // Assumption: no nested table
  if (tableRootPath == null) {
    // when the selection is inside a cell

    return null;
  }

  const selectedRange: CellsRange = [
    Path.relative(startPoint.path, tableRootPath).slice(
      0,
      2,
    ) as CellsRange[number],
    Path.relative(endPoint.path, tableRootPath).slice(
      0,
      2,
    ) as CellsRange[number],
  ];

  // normalize selection range, ensure the selection is from the top-left corner to the bottom-right corner
  let normalizedSelectedRange: CellsRange =
    normalizeSelectedRange(selectedRange);

  const tableInfo = getTableInfo(editor, tableRootPath[0]!);

  if (!tableInfo) {
    // should not happen

    return null;
  }

  normalizedSelectedRange = expandSelectedRange(
    normalizedSelectedRange,
    tableInfo,
  );

  return normalizedSelectedRange;
};
