"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableButton = exports.TableCell = exports.TableRow = exports.Table = void 0;
const react_1 = __importStar(require("react"));
const slate_react_1 = require("slate-react");
const common_utils_1 = require("./common-utils");
const components_1 = require("./components");
const table_utils_1 = require("./table-utils");
const slate_1 = require("slate");
require("./table.css");
const table_constants_1 = require("./table-constants");
const getSelectedRange_1 = require("./table-utils/queries/getSelectedRange");
// only use this hook in table element, since `isSelected` is false when the selection does not include the current cell
const useTableSelection = (element) => {
    const [selectedRange, setSelectedRange] = react_1.default.useState(null);
    const editor = (0, slate_react_1.useSlate)();
    // true when selection crosses the table
    const isSelected = (0, slate_react_1.useSelected)();
    const selection = editor.selection;
    const isTable = element?.type === "table";
    if (!isTable) {
        return null;
    }
    (0, react_1.useEffect)(() => {
        if (!isSelected || !selection) {
            setSelectedRange(null);
            return;
        }
        const newSelectedRange = (0, getSelectedRange_1.getSelectedRange)(editor);
        setSelectedRange(newSelectedRange);
    }, [editor, isSelected, selection]);
    return selectedRange;
};
const TableContext = (0, react_1.createContext)({
    selectedRange: null,
    settings: {
        colSizes: [],
        rowSizes: [],
    },
    resizeInfo: {
        resizing: false,
        direction: "",
        idx: -1,
        start: 0,
        end: 0,
        startResize: (idx, span, direction, position) => { },
        updateResize: (position) => { },
        endResize: () => { },
    },
});
const useCellSelection = (range) => {
    const { selectedRange } = (0, react_1.useContext)(TableContext);
    if (!selectedRange) {
        return false;
    }
    const [[startRow, startCol], [endRow, endCol]] = selectedRange;
    if (
    // bottom-right corner of range is inside the selected range
    range[0][0] >= startRow &&
        range[0][1] >= startCol &&
        range[0][0] <= endRow &&
        range[0][1] <= endCol) {
        return true;
    }
    if (
    // top-left corner of range is inside the selected range
    range[1][0] >= startRow &&
        range[1][1] >= startCol &&
        range[1][0] <= endRow &&
        range[1][1] <= endCol) {
        return true;
    }
    return false;
};
const useResizeHandle = (editor, element) => {
    const [resizing, setResizing] = (0, react_1.useState)(false);
    const [direction, setDirection] = (0, react_1.useState)("");
    const [idx, setIdx] = (0, react_1.useState)(-1);
    const [span, setSpan] = (0, react_1.useState)(1);
    const [start, setStart] = (0, react_1.useState)(0);
    const [end, setEnd] = (0, react_1.useState)(0);
    const [tableIdx] = slate_react_1.ReactEditor.findPath(editor, element);
    const targetIdx = idx + span - 1;
    const startResize = (idx, span, direction, position) => {
        setResizing(true);
        setDirection(direction);
        setIdx(idx);
        setSpan(span);
        setStart(position);
        setEnd(position);
    };
    const updateResize = (position) => {
        let end = position;
        let invariant = null;
        const minSize = direction === "horizontal" ? table_constants_1.MinCellWidth : table_constants_1.MinCellHeight;
        const sizes = direction === "horizontal"
            ? element.settings.colSizes
            : element.settings.rowSizes;
        if (direction === "horizontal" && sizes[targetIdx + 1] !== undefined) {
            invariant = sizes[targetIdx] + sizes[targetIdx + 1];
        }
        const diff = end - start;
        let newSize = sizes[targetIdx] + diff;
        if (newSize < minSize) {
            end = minSize - sizes[targetIdx] + start;
        }
        if (invariant !== null) {
            let newNextSize = sizes[targetIdx + 1] - diff;
            if (newNextSize < minSize) {
                end = invariant - minSize - sizes[targetIdx] + start;
            }
        }
        setEnd(end);
    };
    const endResize = () => {
        slate_1.Transforms.setNodes(editor, {
            settings: direction === "horizontal"
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
        }, { at: [tableIdx] });
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
const Table = ({ style = {}, 
// @ts-ignore
attributes, 
// @ts-ignore
children, 
// @ts-ignore
element, }) => {
    const editor = (0, slate_react_1.useSlate)();
    const selectedRange = useTableSelection(element);
    const isSelected = (0, slate_react_1.useSelected)();
    const resizeInfo = useResizeHandle(editor, element);
    const focusedPath = editor.selection?.focus.path;
    return (react_1.default.createElement(TableContext.Provider, { value: {
            selectedRange,
            settings: element.settings,
            resizeInfo,
        } },
        react_1.default.createElement("div", { style: {
                width: "100%",
            }, onMouseUp: () => {
                if (resizeInfo.resizing) {
                    resizeInfo.endResize();
                }
            }, onMouseMove: (event) => {
                if (resizeInfo.resizing) {
                    resizeInfo.updateResize(resizeInfo.direction === "horizontal"
                        ? event.clientX
                        : event.clientY);
                }
            }, onMouseDown: () => {
                if (selectedRange !== null) {
                    // to prevent drag when selecting cells, this behavior is not programmable, plate js does the same handling
                    slate_1.Transforms.collapse(editor);
                }
            } },
            react_1.default.createElement("table", { style: {
                    ...style,
                    borderCollapse: "collapse",
                    tableLayout: "fixed",
                }, className: selectedRange ? "table-in-selection" : "", ...attributes },
                react_1.default.createElement("colgroup", null, element.settings.colSizes.map((colSize, idx) => {
                    let minWidth = colSize;
                    if (resizeInfo.resizing &&
                        resizeInfo.direction === "horizontal") {
                        const diff = resizeInfo.end - resizeInfo.start;
                        if (idx === resizeInfo.idx) {
                            minWidth = minWidth + diff;
                        }
                        else if (idx === resizeInfo.idx + 1) {
                            minWidth = minWidth - diff;
                        }
                    }
                    return (react_1.default.createElement("col", { key: idx, style: {
                            minWidth: `${minWidth}px`,
                        } }));
                })),
                react_1.default.createElement("tbody", null, children))),
        react_1.default.createElement("div", { contentEditable: false, className: "unselectable" },
            react_1.default.createElement("button", { onClick: () => {
                    const targetPath = focusedPath?.slice(0, 2) ?? [];
                    if (targetPath.length !== 2) {
                        return;
                    }
                    (0, table_utils_1.insertRow)(editor, targetPath);
                }, disabled: !isSelected }, "Insert row"),
            react_1.default.createElement("button", { onClick: () => {
                    const targetPath = focusedPath?.slice(0, 3) ?? [];
                    if (targetPath.length !== 3) {
                        return;
                    }
                    (0, table_utils_1.insertCol)(editor, [targetPath[0], targetPath[2]]);
                }, disabled: !isSelected }, "Insert col"),
            react_1.default.createElement("button", { onClick: () => {
                    const targetPath = focusedPath?.slice(0, 2) ?? [];
                    if (targetPath.length !== 2) {
                        return;
                    }
                    (0, table_utils_1.deleteRow)(editor, targetPath);
                } }, "Delete row"),
            react_1.default.createElement("button", { onClick: () => {
                    const targetPath = focusedPath?.slice(0, 3) ?? [];
                    if (targetPath.length !== 3) {
                        return;
                    }
                    (0, table_utils_1.deleteCol)(editor, [targetPath[0], targetPath[2]]);
                } }, "Delete col"),
            react_1.default.createElement("button", { onClick: () => {
                    // ensured by disabled prop
                    const [tableIdx] = slate_react_1.ReactEditor.findPath(editor, element);
                    (0, table_utils_1.mergeCells)(editor, tableIdx, 
                    // ensured by disabled prop
                    selectedRange);
                }, disabled: !isSelected || !selectedRange }, "Merge cells"),
            react_1.default.createElement("button", { onClick: () => {
                    const [tableIdx, rowIdx, colIdx] = focusedPath?.slice(0, 3) ?? [];
                    if (tableIdx === undefined ||
                        rowIdx === undefined ||
                        colIdx === undefined) {
                        return;
                    }
                    (0, table_utils_1.splitCell)(editor, [tableIdx, rowIdx, colIdx]);
                } }, "Split cell"))));
};
exports.Table = Table;
const TableRow = ({ style = {}, 
// @ts-ignore
attributes, 
// @ts-ignore
children, 
// @ts-ignore
element, }) => {
    return (react_1.default.createElement("tr", { style: style, ...attributes }, children));
};
exports.TableRow = TableRow;
const TableCell = ({ style = {}, 
// @ts-ignore
attributes, 
// @ts-ignore
children, 
// @ts-ignore
element, }) => {
    const editor = (0, slate_react_1.useSlate)();
    const { settings, resizeInfo: { resizing, direction, idx: resizeIdx, start, end }, } = (0, react_1.useContext)(TableContext);
    // Assumption: no nested table, so the path is always [tableIdxAtRoot, rowIdx, colIdx]
    const [, rowIdx, colIdx] = slate_react_1.ReactEditor.findPath(editor, element);
    const { rowSpan = 1, colSpan = 1 } = element;
    const isCellSelected = useCellSelection([
        [rowIdx, colIdx],
        [rowIdx + rowSpan - 1, colIdx + colSpan - 1],
    ]);
    let minHeight = settings.rowSizes[rowIdx];
    if (resizing && direction === "vertical" && resizeIdx === rowIdx) {
        minHeight += end - start;
    }
    const domNode = (0, react_1.useMemo)(() => {
        try {
            return slate_react_1.ReactEditor.toDOMNode(editor, element);
        }
        catch (error) {
            // spanned cell has no dom node
            return null;
        }
    }, [editor, element]);
    (0, react_1.useEffect)(() => {
        if (domNode !== null) {
            // console.log(domNode.getBoundingClientRect());
        }
    }, [domNode]);
    if (element.colSpan === 0 || element.rowSpan === 0) {
        return null;
    }
    return (react_1.default.createElement("td", { style: {
            ...style,
            border: "1px solid",
            padding: "4px 8px",
            verticalAlign: "top",
            position: "relative",
            // height for cell works as min-height in div
            height: `${minHeight ?? 0}px`,
        }, className: isCellSelected ? "cell-selected" : "", rowSpan: rowSpan, colSpan: colSpan, ...attributes },
        children,
        react_1.default.createElement(ResizeHandle, { direction: "horizontal", idx: colIdx, span: element.colSpan }),
        react_1.default.createElement(ResizeHandle, { direction: "vertical", idx: rowIdx, span: element.rowSpan })));
};
exports.TableCell = TableCell;
const ResizeHandle = ({ idx, direction, span }) => {
    const { resizeInfo: { resizing, idx: targetIdx, direction: resizeDirection, startResize, }, } = (0, react_1.useContext)(TableContext);
    const active = resizing && resizeDirection === direction && idx + span - 1 === targetIdx;
    return (react_1.default.createElement("div", { className: `table-resize-handle ${direction === "horizontal"
            ? "column-resize-handle"
            : "row-resize-handle"}`, style: {
            ...(active ? { backgroundColor: "blue", opacity: 1 } : {}),
        }, onMouseDown: (event) => {
            event.preventDefault();
            startResize(idx, span, direction, direction === "horizontal" ? event.clientX : event.clientY);
        } }));
};
// @ts-ignore
const TableButton = ({ icon }) => {
    const editor = (0, slate_react_1.useSlate)();
    return (react_1.default.createElement(components_1.Button, { active: (0, common_utils_1.isBlockActive)(editor, "table"), onMouseDown: (event) => {
            event.preventDefault();
            (0, table_utils_1.insertTable)(editor);
        } },
        react_1.default.createElement(components_1.Icon, null, icon)));
};
exports.TableButton = TableButton;
