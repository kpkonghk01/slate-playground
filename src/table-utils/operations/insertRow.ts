import { Editor, Transforms } from "slate";
import { CellElement, TableElement } from "../../table-types";
import { initRow } from "../initTableElements";
import { getTableInfo } from "../queries/getTableInfo";
import { findSpanRootLocation } from "../queries/findSpanRootLocation";
import { getSpannedColIndexesOfRow } from "../queries/getSpannedColIndexesOfRow";

// target should in the form of [tableIdxAtRoot, rowIdx]
export const insertRow = (editor: Editor, target: [number, number]) => {
  if (target.length !== 2) {
    // malformed target
    return;
  }

  const [tableIdx, insertAt] = target;
  const tableInfo = getTableInfo(editor, tableIdx);

  if (!tableInfo) {
    // target is not inside a table
    return;
  }

  const { tableNode, numberOfRows, numberOfCols } = tableInfo;

  if (insertAt < 0 || insertAt > numberOfRows) {
    // out of range
    return;
  }

  const rowSpannedAt = getSpannedColIndexesOfRow(tableNode, insertAt);

  const newRow = initRow(numberOfCols);

  for (let colIdx = 0; colIdx < numberOfCols; colIdx++) {
    // existence is ensured by initRow
    const newCell = newRow.children[colIdx] as CellElement;

    if (!rowSpannedAt.has(colIdx)) {
      continue;
    }

    newCell.rowSpan = 0;
    newCell.colSpan = 0;

    // find the root span cell if it is in the same column
    const spanRootAt = findSpanRootLocation(tableNode, [insertAt, colIdx]);

    if (!spanRootAt) {
      // malformed table
      continue;
    }

    const [rowSpannedFrom] = spanRootAt;
    const rowSpanCell = tableNode.children[rowSpannedFrom]!.children[colIdx]!;

    if (rowSpanCell.rowSpan === 0) {
      continue;
    }

    if (rowSpannedFrom + rowSpanCell.rowSpan - 1 >= insertAt) {
      // extend the rowSpanned cell
      Transforms.setNodes<CellElement>(
        editor,
        {
          rowSpan: rowSpanCell.rowSpan + 1,
        },
        {
          at: [tableIdx, rowSpannedFrom, colIdx],
        },
      );
    }
  }

  Transforms.setNodes<TableElement>(
    editor,
    {
      settings: {
        colSizes: tableNode.settings.colSizes,
        rowSizes: [
          ...tableNode.settings.rowSizes.slice(0, insertAt),
          0,
          ...tableNode.settings.rowSizes.slice(insertAt),
        ],
      },
    },
    { at: [tableIdx] },
  );
  Transforms.insertNodes(editor, newRow, { at: target });
};
