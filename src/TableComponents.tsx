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
} from "./table-utils";
import { Path, Range } from "slate";

import "./table.css";

type TableSelection = [[number, number], [number, number]];

// only use this hook in table element, since `isSelected` is false when the selection does not include the current cell
const useTableSelection = (element: any) => {
  const [selectedRange, setSelectedRange] =
    React.useState<TableSelection | null>(null);

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

    const currentSelectedRange: TableSelection = [
      Path.relative(startPoint.path, tableRootPath).slice(
        0,
        2
      ) as TableSelection[number],
      Path.relative(endPoint.path, tableRootPath).slice(
        0,
        2
      ) as TableSelection[number],
    ];

    // normalize selection range, ensure the selection is from the top-left corner to the bottom-right corner
    const normalizedSelectedRange: TableSelection = [
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
  selectedRange: null as TableSelection | null,
});

const useCellSelection = (rowId: number, colIdx: number) => {
  const { selectedRange } = useContext(TableContext);

  if (!selectedRange) {
    return false;
  }

  const [[startRow, startCol], [endRow, endCol]] = selectedRange;

  const rowInRange = rowId >= startRow && rowId <= endRow;
  const colInRange = colIdx >= startCol && colIdx <= endCol;

  return rowInRange && colInRange;
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

  const isCellSelected = useCellSelection(rowIdx, colIdx);

  return (
    <td
      style={{
        ...style,
        border: "1px solid",
        padding: "4px 8px",
      }}
      className={isCellSelected ? "cell-selected" : ""}
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
