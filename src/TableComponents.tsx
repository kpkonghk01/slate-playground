import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ReactEditor, useSelected, useSlate } from "slate-react";
import { isBlockActive } from "./common-utils";
import { Button, Icon } from "./components";
import {
  deleteCol,
  deleteRow,
  getSelectedTablePath,
  getTableInfo,
  insertCol,
  insertRow,
  insertTable,
  mergeCells,
  splitCell,
} from "./table-utils";
import { Path, Range, Transforms } from "slate";

import "./table.css";
import { CellsRange, ResizeDirection, TableElement } from "./table-types";
import { findSpanRootLocation } from "./table-utils/findSpanRootLocation";
import { findSpanCornerLocation } from "./table-utils/findSpanCornerLocation";
import { MinCellWidth } from "./table-constants";

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

    if (
      normalizedSelectedRange[0][0] === normalizedSelectedRange[1][0] &&
      normalizedSelectedRange[0][1] === normalizedSelectedRange[1][1]
    ) {
      // single cell selected
      setSelectedRange(null);
      return;
    }

    // TODO: scan the border, see if any cell is merged and expand the range if necessary
    const tableInfo = getTableInfo(editor, tableRootPath[0]!);

    if (!tableInfo) {
      // should not happen
      return;
    }

    const { tableNode, numberOfRows, numberOfCols } = tableInfo;

    // expand the range if any cell is merged at the border of the selected range
    let expansionDetected = false;

    // prevent infinite loop, just in case
    let breaker = 0;

    // limit the number of iterations, should cover all the cells in the table once
    let limit =
      // table size
      numberOfRows * numberOfCols +
      // 4 corners are counted twice in each iteration below
      numberOfRows +
      numberOfCols;

    do {
      breaker++;
      expansionDetected = false;
      const [[startRow, startCol], [endRow, endCol]] = normalizedSelectedRange;

      // expand vertically
      for (let row = startRow; row <= endRow; row++) {
        // extend the selected range with the root location of the spanned cell
        leftBorder: {
          const rootLocation = findSpanRootLocation(tableNode, [row, startCol]);

          if (!rootLocation) {
            // impossible
            console.error("rootLocation not found", tableNode, [row, startCol]);

            break leftBorder;
          }

          if (rootLocation[0] === row && rootLocation[1] === startCol) {
            // not a spanned cell

            break leftBorder;
          }

          const newLocation: CellsRange[number] = [
            Math.min(normalizedSelectedRange[0][0], rootLocation[0]),
            Math.min(normalizedSelectedRange[0][1], rootLocation[1]),
          ];

          if (
            newLocation[0] !== normalizedSelectedRange[0][0] ||
            newLocation[1] !== normalizedSelectedRange[0][1]
          ) {
            normalizedSelectedRange[0] = newLocation;
            expansionDetected = true;
          }
        }

        rightBorder: {
          const cornerLocation = findSpanCornerLocation(tableNode, [
            row,
            endCol,
          ]);

          if (!cornerLocation) {
            // impossible
            console.error("cornerLocation not found", tableNode, [row, endCol]);

            break rightBorder;
          }

          if (cornerLocation[0] === row && cornerLocation[1] === endCol) {
            // not a spanned cell

            break rightBorder;
          }

          const newLocation: CellsRange[number] = [
            Math.max(normalizedSelectedRange[1][0], cornerLocation[0]),
            Math.max(normalizedSelectedRange[1][1], cornerLocation[1]),
          ];

          if (
            newLocation[0] !== normalizedSelectedRange[1][0] ||
            newLocation[1] !== normalizedSelectedRange[1][1]
          ) {
            normalizedSelectedRange[1] = newLocation;
            expansionDetected = true;
          }
        }
      }

      // expand horizontally
      for (let col = startCol; col <= endCol; col++) {
        topBorder: {
          const rootLocation = findSpanRootLocation(tableNode, [startRow, col]);

          if (!rootLocation) {
            // impossible
            console.error("rootLocation not found", tableNode, [startRow, col]);

            break topBorder;
          }

          if (rootLocation[0] === startRow && rootLocation[1] === col) {
            // not a spanned cell

            break topBorder;
          }

          const newLocation: CellsRange[number] = [
            Math.min(normalizedSelectedRange[0][0], rootLocation[0]),
            Math.min(normalizedSelectedRange[0][1], rootLocation[1]),
          ];

          if (
            newLocation[0] !== normalizedSelectedRange[0][0] ||
            newLocation[1] !== normalizedSelectedRange[0][1]
          ) {
            normalizedSelectedRange[0] = newLocation;
            expansionDetected = true;
          }
        }

        bottomBorder: {
          const cornerLocation = findSpanCornerLocation(tableNode, [
            endRow,
            col,
          ]);

          if (!cornerLocation) {
            // impossible
            console.error("cornerLocation not found", tableNode, [endRow, col]);

            break bottomBorder;
          }

          if (cornerLocation[0] === endRow && cornerLocation[1] === col) {
            // not a spanned cell

            break bottomBorder;
          }

          const newLocation: CellsRange[number] = [
            Math.max(normalizedSelectedRange[1][0], cornerLocation[0]),
            Math.max(normalizedSelectedRange[1][1], cornerLocation[1]),
          ];

          if (
            newLocation[0] !== normalizedSelectedRange[1][0] ||
            newLocation[1] !== normalizedSelectedRange[1][1]
          ) {
            normalizedSelectedRange[1] = newLocation;
            expansionDetected = true;
          }
        }
      }
    } while (expansionDetected && breaker < limit);

    setSelectedRange(normalizedSelectedRange);
  }, [editor, isSelected, selection]);

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
      position: number
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
    position: number
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

    if (
      direction === "horizontal" &&
      element.settings.colSizes[targetIdx + 1] !== undefined
    ) {
      invariant =
        element.settings.colSizes[targetIdx]! +
        element.settings.colSizes[targetIdx + 1]!;
    }

    const diff = end - start;
    let newSize = element.settings.colSizes[targetIdx]! + diff;

    if (newSize < MinCellWidth) {
      end = MinCellWidth - element.settings.colSizes[targetIdx]! + start;
    }

    if (invariant !== null) {
      let newNextSize = element.settings.colSizes[targetIdx + 1]! - diff;

      if (newNextSize < MinCellWidth) {
        end =
          invariant -
          MinCellWidth -
          element.settings.colSizes[targetIdx]! +
          start;
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
      { at: [tableIdx] }
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
                : event.clientY
            );
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
          direction === "horizontal" ? event.clientX : event.clientY
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
