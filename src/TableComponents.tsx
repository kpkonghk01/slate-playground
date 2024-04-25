import React, { createContext, useContext, useEffect } from "react";
import { ReactEditor, useSelected, useSlate } from "slate-react";
import { isBlockActive } from "./common-utils";
import { Button, Icon } from "./components";
import {
  deleteCol,
  deleteRow,
  getSelectedTablePath,
  insertCol,
  insertRow,
  insertTable,
  mergeCells,
} from "./table-utils";
import { Path, Range } from "slate";

import "./table.css";
import { CellsRange } from "./table-types";

// only use this hook in table element, since `isSelected` is false when the selection does not include the current cell
const useTableSelection = (element: any) => {
  const [selectedRange, setSelectedRange] = React.useState<CellsRange | null>(
    null
  );

  const editor = useSlate();

  // true when selection crosses the table
  const isSelected = useSelected();
  const selection = editor.selection;
  const isTable = element?.type === "table";

  if (!isTable) {
    return null;
  }

  useEffect(() => {
    // FIXME: if the cells are empty, the selection crosses two cells in a row will not be detected
    if (!isSelected || !selection) {
      setSelectedRange(null);
      return;
    }
    // True when start and end points of the selection equals
    // const collapsed = Range.isCollapsed(selection);

    const tableRootPath = getSelectedTablePath(editor);

    // Assumption: no nested table
    if (tableRootPath === null) {
      // when the selection is inside a table cell
      setSelectedRange(null);
      return;
    }

    // edges must be forward direction of selection
    const [startPoint, endPoint] = Range.edges(selection); // equals to `Editor.edges(editor, selection)`

    const currentSelectedRange: CellsRange = [
      Path.relative(startPoint.path, tableRootPath).slice(
        0,
        2
      ) as CellsRange[number],
      Path.relative(endPoint.path, tableRootPath).slice(
        0,
        2
      ) as CellsRange[number],
    ];

    // normalize selection range, ensure the selection is from the top-left corner to the bottom-right corner
    const normalizedSelectedRange: CellsRange = [
      [
        Math.min(currentSelectedRange[0][0], currentSelectedRange[1][0]),
        Math.min(currentSelectedRange[0][1], currentSelectedRange[1][1]),
      ],
      [
        Math.max(currentSelectedRange[0][0], currentSelectedRange[1][0]),
        Math.max(currentSelectedRange[0][1], currentSelectedRange[1][1]),
      ],
    ];

    // TODO: scan the border, see if any cell is merged and expand the range if necessary

    setSelectedRange(normalizedSelectedRange);
  }, [editor, isSelected, selection]);

  return selectedRange;
};

const TableContext = createContext({
  selectedRange: null as CellsRange | null,
});

const useCellSelection = (range: CellsRange) => {
  const { selectedRange } = useContext(TableContext);

  if (!selectedRange) {
    return false;
  }

  const [[startRow, startCol], [endRow, endCol]] = selectedRange;

  if (
    // bottom-right corner of range is inside the selected range
    range[0][0] >= startRow &&
    range[0][1] >= startCol &&
    range[0][0] <= endRow &&
    range[0][1] <= endCol
  ) {
    return true;
  }

  if (
    // top-left corner of range is inside the selected range
    range[1][0] >= startRow &&
    range[1][1] >= startCol &&
    range[1][0] <= endRow &&
    range[1][1] <= endCol
  ) {
    return true;
  }

  return false;
};

// @ts-ignore
export const TableElement = ({ style = {}, attributes, children, element }) => {
  const editor = useSlate() as ReactEditor;
  const selectedRange = useTableSelection(element);
  const isSelected = useSelected();

  const focusedPath = editor.selection?.focus.path;

  return (
    <TableContext.Provider value={{ selectedRange }}>
      <table
        style={{
          ...style,
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
        }}
        className={selectedRange ? "table-in-selection" : ""}
        {...attributes}
      >
        <tbody>{children}</tbody>
      </table>
      <div contentEditable={false}>
        <button
          onClick={() => {
            const targetPath = focusedPath?.slice(0, 2) ?? [];

            if (targetPath.length !== 2) {
              return;
            }

            insertRow(editor, targetPath as [number, number]);
          }}
          disabled={!isSelected}
        >
          Insert row
        </button>
        <button
          onClick={() => {
            const targetPath = focusedPath?.slice(0, 3) ?? [];

            if (targetPath.length !== 3) {
              return;
            }

            insertCol(editor, [targetPath[0], targetPath[2]] as [
              number,
              number
            ]);
          }}
          disabled={!isSelected}
        >
          Insert col
        </button>
        <button
          onClick={() => {
            const targetPath = focusedPath?.slice(0, 2) ?? [];

            if (targetPath.length !== 2) {
              return;
            }

            deleteRow(editor, targetPath as [number, number]);
          }}
        >
          Delete row
        </button>
        <button
          onClick={() => {
            const targetPath = focusedPath?.slice(0, 3) ?? [];

            if (targetPath.length !== 3) {
              return;
            }

            deleteCol(editor, [targetPath[0], targetPath[2]] as [
              number,
              number
            ]);
          }}
        >
          Delete col
        </button>
        <button
          onClick={() => {
            // ensured by disabled prop
            const [tableIdx] = ReactEditor.findPath(editor, element) as [
              number
            ];

            mergeCells(
              editor,
              tableIdx,
              // ensured by disabled prop
              selectedRange!
            );
          }}
          disabled={!isSelected || !selectedRange}
        >
          Merge cells
        </button>
      </div>
    </TableContext.Provider>
  );
};

export const TableRowElement = ({
  style = {},
  // @ts-ignore
  attributes,
  // @ts-ignore
  children,
  // @ts-ignore
  element,
}) => {
  return (
    <tr
      style={style}
      {...attributes}
      rowSpan={element.rowSpan ?? 1}
      colSpan={element.colSpan ?? 1}
    >
      {children}
    </tr>
  );
};

export const TableCellElement = ({
  style = {},
  // @ts-ignore
  attributes,
  // @ts-ignore
  children,
  // @ts-ignore
  element,
}) => {
  // @ts-ignore

  const editor = useSlate() as ReactEditor;

  // Assumption: no nested table, so the path is always [tableIdxAtRoot, rowIdx, colIdx]
  const [, rowIdx, colIdx] = ReactEditor.findPath(editor, element) as [
    number,
    number,
    number
  ];

  const { rowSpan = 1, colSpan = 1 } = element as {
    rowSpan: number;
    colSpan: number;
  };

  const isCellSelected = useCellSelection([
    [rowIdx, colIdx],
    [rowIdx + rowSpan - 1, colIdx + colSpan - 1],
  ]);

  if (element.colSpan === 0 || element.rowSpan === 0) {
    return null;
  }

  return (
    <td
      style={{
        ...style,
        border: "1px solid",
        padding: "4px 8px",
      }}
      className={isCellSelected ? "cell-selected" : ""}
      rowSpan={rowSpan}
      colSpan={colSpan}
      {...attributes}
    >
      {children}
    </td>
  );
};

// @ts-ignore
export const TableButton = ({ icon }) => {
  const editor = useSlate();
  return (
    <Button
      active={isBlockActive(editor, "table")}
      onMouseDown={(event: { preventDefault: () => void }) => {
        event.preventDefault();
        insertTable(editor);
      }}
    >
      <Icon>{icon}</Icon>
    </Button>
  );
};
