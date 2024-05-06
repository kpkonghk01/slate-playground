import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ReactEditor, useSelected, useSlate } from "slate-react";
import { isBlockActive } from "./common-utils";
import { Button, Icon } from "./components";
import {
  deleteCol,
  deleteRow,
  insertCol,
  insertRow,
  insertTable,
  mergeCells,
  splitCell,
} from "./table-utils";
import { Transforms } from "slate";

import "./table.css";
import { CellsRange, ResizeDirection, TableElement } from "./table-types";
import { MinCellHeight, MinCellWidth } from "./table-constants";
import { getSelectedRange } from "./table-utils/queries/getSelectedRange";

// only use this hook in table element, since `isSelected` is false when the selection does not include the current cell
const useTableSelection = (element: any) => {
  const [selectedRange, setSelectedRange] = React.useState<CellsRange | null>(
    null,
  );

  const editor = useSlate() as ReactEditor;

  // true when selection crosses the table
  const isSelected = useSelected();
  const selection = editor.selection;
  const isTable = element?.type === "table";

  useEffect(() => {
    if (!isSelected || !selection) {
      setSelectedRange(null);

      return;
    }

    const newSelectedRange = getSelectedRange(editor);

    setSelectedRange(newSelectedRange);
  }, [editor, isSelected, selection]);

  if (!isTable) {
    return null;
  }

  return selectedRange;
};

const TableContext = createContext({
  selectedRange: null as CellsRange | null,
  settings: {
    colSizes: [],
    rowSizes: [],
  } as TableElement["settings"],
  resizeInfo: {
    resizing: false,
    direction: "",
    idx: -1,
    start: 0,
    end: 0,
    startResize: (
      idx: number,
      span: number,
      direction: "" | ResizeDirection,
      position: number,
    ) => {},
    updateResize: (position: number) => {},
    endResize: () => {},
  },
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

const useResizeHandle = (editor: ReactEditor, element: TableElement) => {
  const [resizing, setResizing] = useState(false);
  const [direction, setDirection] = useState<"" | ResizeDirection>("");
  const [idx, setIdx] = useState(-1);
  const [span, setSpan] = useState(1);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);

  const [tableIdx] = ReactEditor.findPath(editor, element) as [number];
  const targetIdx = idx + span - 1;

  const startResize = (
    idx: number,
    span: number,
    direction: "" | ResizeDirection,
    position: number,
  ) => {
    setResizing(true);
    setDirection(direction);
    setIdx(idx);
    setSpan(span);
    setStart(position);
    setEnd(position);
  };

  const updateResize = (position: number) => {
    let end = position;
    let invariant: number | null = null;
    const minSize = direction === "horizontal" ? MinCellWidth : MinCellHeight;
    const sizes =
      direction === "horizontal"
        ? element.settings.colSizes
        : element.settings.rowSizes;

    if (direction === "horizontal" && sizes[targetIdx + 1] !== undefined) {
      invariant = sizes[targetIdx]! + sizes[targetIdx + 1]!;
    }

    const diff = end - start;
    let newSize = sizes[targetIdx]! + diff;

    if (newSize < minSize) {
      end = minSize - sizes[targetIdx]! + start;
    }

    if (invariant !== null) {
      let newNextSize = sizes[targetIdx + 1]! - diff;

      if (newNextSize < minSize) {
        end = invariant - minSize - sizes[targetIdx]! + start;
      }
    }

    setEnd(end);
  };

  const endResize = () => {
    Transforms.setNodes<TableElement>(
      editor,
      {
        settings:
          direction === "horizontal"
            ? {
                ...element.settings,
                colSizes: element.settings.colSizes.map((size, i) => {
                  if (i === idx + span - 1) {
                    return size + end - start;
                  }

                  if (i === idx + span) {
                    return size - end + start;
                  }

                  return size;
                }),
              }
            : {
                ...element.settings,
                rowSizes: element.settings.rowSizes.map((size, i) => {
                  if (i === idx + span - 1) {
                    return size + end - start;
                  }

                  return size;
                }),
              },
      },
      { at: [tableIdx] },
    );

    // reset initial state
    setResizing(false);
    setDirection("");
    setIdx(-1);
    setSpan(1);
    setStart(0);
    setEnd(0);
  };

  return {
    resizing,
    direction,
    idx: targetIdx,
    start,
    end,
    startResize,
    updateResize,
    endResize,
  };
};

export const Table = ({
  style = {},
  // @ts-ignore
  attributes,
  // @ts-ignore
  children,
  // @ts-ignore
  element,
}) => {
  const editor = useSlate() as ReactEditor;
  const selectedRange = useTableSelection(element);
  const isSelected = useSelected();
  const resizeInfo = useResizeHandle(editor, element);

  const focusedPath = editor.selection?.focus.path;

  return (
    <TableContext.Provider
      value={{
        selectedRange,
        settings: element.settings,
        resizeInfo,
      }}
    >
      {/* wrapper of table */}
      <div
        style={{
          width: "100%",
        }}
        onMouseUp={() => {
          if (resizeInfo.resizing) {
            resizeInfo.endResize();
          }
        }}
        onMouseMove={(event) => {
          if (resizeInfo.resizing) {
            resizeInfo.updateResize(
              resizeInfo.direction === "horizontal"
                ? event.clientX
                : event.clientY,
            );
          }
        }}
        onMouseDown={() => {
          if (selectedRange !== null) {
            // to prevent drag when selecting cells, this behavior is not programmable, plate js does the same handling
            Transforms.collapse(editor);
          }
        }}
      >
        <table
          style={{
            ...style,
            borderCollapse: "collapse",
            tableLayout: "fixed",
          }}
          className={selectedRange ? "table-in-selection" : ""}
          {...attributes}
        >
          <colgroup>
            {(element as TableElement).settings.colSizes.map((colSize, idx) => {
              let minWidth = colSize;

              if (
                resizeInfo.resizing &&
                resizeInfo.direction === "horizontal"
              ) {
                const diff = resizeInfo.end - resizeInfo.start;

                if (idx === resizeInfo.idx) {
                  minWidth = minWidth + diff;
                } else if (idx === resizeInfo.idx + 1) {
                  minWidth = minWidth - diff;
                }
              }

              return (
                <col
                  key={idx}
                  style={{
                    minWidth: `${minWidth}px`,
                  }}
                />
              );
            })}
          </colgroup>
          <tbody>{children}</tbody>
        </table>
      </div>
      <div contentEditable={false} className="unselectable">
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
              number,
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
              number,
            ]);
          }}
        >
          Delete col
        </button>
        <button
          onClick={() => {
            // ensured by disabled prop
            const [tableIdx] = ReactEditor.findPath(editor, element) as [
              number,
            ];

            mergeCells(
              editor,
              tableIdx,
              // ensured by disabled prop
              selectedRange!,
            );
          }}
          disabled={!isSelected || !selectedRange}
        >
          Merge cells
        </button>
        <button
          onClick={() => {
            const [tableIdx, rowIdx, colIdx] = focusedPath?.slice(0, 3) ?? [];

            if (
              tableIdx === undefined ||
              rowIdx === undefined ||
              colIdx === undefined
            ) {
              return;
            }

            splitCell(editor, [tableIdx, rowIdx, colIdx]);
          }}
        >
          Split cell
        </button>
      </div>
    </TableContext.Provider>
  );
};

export const TableRow = ({
  style = {},
  // @ts-ignore
  attributes,
  // @ts-ignore
  children,
  // @ts-ignore
  element,
}) => {
  return (
    <tr style={style} {...attributes}>
      {children}
    </tr>
  );
};

export const TableCell = ({
  style = {},
  // @ts-ignore
  attributes,
  // @ts-ignore
  children,
  // @ts-ignore
  element,
}) => {
  const editor = useSlate() as ReactEditor;
  const {
    settings,
    resizeInfo: { resizing, direction, idx: resizeIdx, start, end },
  } = useContext(TableContext);

  // Assumption: no nested table, so the path is always [tableIdxAtRoot, rowIdx, colIdx]
  const [, rowIdx, colIdx] = ReactEditor.findPath(editor, element) as [
    number,
    number,
    number,
  ];

  const { rowSpan = 1, colSpan = 1 } = element as {
    rowSpan: number;
    colSpan: number;
  };

  const isCellSelected = useCellSelection([
    [rowIdx, colIdx],
    [rowIdx + rowSpan - 1, colIdx + colSpan - 1],
  ]);

  let minHeight = settings.rowSizes[rowIdx]!;

  if (resizing && direction === "vertical" && resizeIdx === rowIdx) {
    minHeight += end - start;
  }

  const domNode = useMemo(() => {
    try {
      return ReactEditor.toDOMNode(editor, element) as HTMLTableCellElement;
    } catch (error) {
      // spanned cell has no dom node
      return null;
    }
  }, [editor, element]);

  useEffect(() => {
    if (domNode !== null) {
      // console.log(domNode.getBoundingClientRect());
    }
  }, [domNode]);

  if (element.colSpan === 0 || element.rowSpan === 0) {
    return null;
  }

  return (
    <td
      style={{
        ...style,
        border: "1px solid",
        padding: "4px 8px",
        verticalAlign: "top",
        position: "relative",
        // height for cell works as min-height in div
        height: `${minHeight ?? 0}px`,
      }}
      className={isCellSelected ? "cell-selected" : ""}
      rowSpan={rowSpan}
      colSpan={colSpan}
      {...attributes}
    >
      {children}
      <ResizeHandle
        direction="horizontal"
        idx={colIdx}
        span={element.colSpan}
      />
      <ResizeHandle direction="vertical" idx={rowIdx} span={element.rowSpan} />
    </td>
  );
};

type ResizeHandleProps = {
  idx: number;
  direction: ResizeDirection;
  span: number;
};

const ResizeHandle = ({ idx, direction, span }: ResizeHandleProps) => {
  const {
    resizeInfo: {
      resizing,
      idx: targetIdx,
      direction: resizeDirection,
      startResize,
    },
  } = useContext(TableContext);

  const active =
    resizing && resizeDirection === direction && idx + span - 1 === targetIdx;

  return (
    <div
      className={`table-resize-handle ${
        direction === "horizontal"
          ? "column-resize-handle"
          : "row-resize-handle"
      }`}
      style={{
        ...(active ? { backgroundColor: "blue", opacity: 1 } : {}),
      }}
      onMouseDown={(event) => {
        event.preventDefault();

        startResize(
          idx,
          span,
          direction,
          direction === "horizontal" ? event.clientX : event.clientY,
        );
      }}
    />
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
