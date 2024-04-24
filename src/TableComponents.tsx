import React, { useEffect } from "react";
import { useSelected, useSlate } from "slate-react";
import { isBlockActive } from "./common-utils";
import { Button, Icon } from "./components";
import { getSelectedTablePath, toggleTable } from "./table-utils";
import { Editor, Node, Path, Range } from "slate";

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
    if (tableRootPath.length !== 1) {
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

// @ts-ignore
export const TableElement = ({ style = {}, attributes, children, element }) => {
  const selectedRange = useTableSelection(element);

  useEffect(() => {
    console.log("selectedRange:", JSON.stringify(selectedRange, null, 2));
  }, [selectedRange]);

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
    <table
      style={{
        ...style,
        width: "100%",
        borderCollapse: "collapse",
        tableLayout: "fixed",
      }}
      {...attributes}
    >
      <tbody>{children}</tbody>
    </table>
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
  return (
    <td
      style={{
        ...style,
        border: "1px solid",
        padding: "4px 8px",
      }}
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
