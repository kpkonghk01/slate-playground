import React, { createContext, useContext, useEffect } from "react";
import { ReactEditor, useSelected, useSlate } from "slate-react";
import { isBlockActive } from "./common-utils";
import { Button, Icon } from "./components";
import { getSelectedTablePath, toggleTable } from "./table-utils";
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
    if (!isSelected || !selection) {
      setSelectedRange(null);
      return;
    }
    // True when start and end points of the selection are equal
    // const collapsed = Range.isCollapsed(selection);
    // console.log("collapsed:", collapsed);

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

    setSelectedRange(currentSelectedRange);
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

  // left top to right bottom case
  const colInRange = colIdx >= startCol && colIdx <= endCol;
  // right top to left bottom case
  const colInRangeReverse = colIdx <= startCol && colIdx >= endCol;

  return rowInRange && (colInRange || colInRangeReverse);
};

// @ts-ignore
export const TableElement = ({ style = {}, attributes, children, element }) => {
  const selectedRange = useTableSelection(element);

  // console.log(
  //   "element:",
  //   element,
  //   ", isBlock:",
  //   Editor.isBlock(editor, element),
  //   "isElement:",
  //   Element.isElement(element),
  //   "isInline",
  //   Editor.isInline(editor, element)
  // );

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
        toggleTable(editor);
      }}
    >
      <Icon>{icon}</Icon>
    </Button>
  );
};
