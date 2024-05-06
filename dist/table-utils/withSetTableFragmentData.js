"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withSetTableFragmentData = void 0;
const slate_1 = require("slate");
const getSelectedTablePath_1 = require("./queries/getSelectedTablePath");
const getSelectedRange_1 = require("./queries/getSelectedRange");
const getTableInfo_1 = require("./queries/getTableInfo");
const withSetTableFragmentData = (editor) => {
    const { setFragmentData } = editor;
    editor.setFragmentData = (data, originEvent) => {
        const { selection } = editor;
        if (!selection) {
            // should not set anything when there is no selection
            return;
        }
        if (slate_1.Range.isCollapsed(selection) || !originEvent) {
            setFragmentData(data, originEvent);
            return;
        }
        const tableRootPath = (0, getSelectedTablePath_1.getSelectedTablePath)(editor);
        if (tableRootPath == null) {
            // non selection table detected
            const cellsGenerator = slate_1.Editor.nodes(editor, {
                at: selection,
                match: (n) => {
                    // @ts-ignore
                    return n.type === "table-cell";
                },
            });
            if (!cellsGenerator.next().done) {
                // cross table selection with table elements
                // collapse the selection to prevent insert text with cross selection
                slate_1.Transforms.collapse(editor);
                // FIXME: even we prevent copy fragment data, the paste event is still triggered when drag
                return;
            }
            setFragmentData(data, originEvent);
            return;
        }
        // selection is inside a table
        const selectedRange = (0, getSelectedRange_1.getSelectedRange)(editor);
        if (!selectedRange) {
            setFragmentData(data, originEvent);
            return;
        }
        // cross cells selection
        const initialSelection = selection;
        const tableInfo = (0, getTableInfo_1.getTableInfo)(editor, tableRootPath[0]);
        const [[startRow, startCol], [endRow, endCol]] = selectedRange;
        if (!tableInfo) {
            // should not happen
            setFragmentData(data, originEvent);
            return;
        }
        const { tableNode } = tableInfo;
        // Edit from withSetFragmentDataTable
        // ref: https://github.com/udecode/plate/blob/main/packages/table/src/withSetFragmentDataTable.ts
        let textCsv = "";
        let textTsv = "";
        const divElement = document.createElement("div");
        const tableElement = document.createElement("table");
        const tableRows = tableNode.children;
        slate_1.Editor.withoutNormalizing(editor, () => {
            for (let rowIdx = startRow; rowIdx <= endRow; rowIdx++) {
                const row = tableRows[rowIdx];
                const rowCells = row.children;
                const rowPath = tableRootPath.concat(rowIdx);
                const cellStrings = [];
                // Assumption: not support th element
                const rowElement = document.createElement("tr");
                for (let colIdx = startCol; colIdx <= endCol; colIdx++) {
                    const cell = rowCells[colIdx];
                    // need to clean data before every iteration
                    data.clearData();
                    const cellPath = rowPath.concat(colIdx);
                    // select cell by cell
                    slate_1.Transforms.select(editor, {
                        anchor: slate_1.Editor.start(editor, cellPath.concat([0, 0])),
                        focus: slate_1.Editor.end(editor, cellPath.concat([cell.children.length - 1, 0])),
                    });
                    // set data from selection
                    setFragmentData(data);
                    // get plain text
                    cellStrings.push(data.getData("text/plain"));
                    const cellElement = document.createElement("td");
                    cellElement.colSpan = cell.colSpan;
                    cellElement.rowSpan = cell.rowSpan;
                    cellElement.innerHTML = data.getData("text/html");
                    if (cellElement.rowSpan && cellElement.colSpan) {
                        rowElement.append(cellElement);
                    }
                }
                tableElement.append(rowElement);
                textCsv += `"${cellStrings.join('","')}"\n`;
                textTsv += `"${cellStrings.join('"\t"')}"\n`;
            }
        });
        divElement.append(tableElement);
        data.setData("text/html", divElement.innerHTML);
        data.setData("text/csv", textCsv);
        data.setData("text/tsv", textTsv);
        data.setData("text/plain", textTsv);
        const selectedFragmentStr = JSON.stringify(tableNode);
        const encodedFragment = window.btoa(encodeURIComponent(selectedFragmentStr));
        data.setData("application/x-slate-fragment", encodedFragment);
        slate_1.Transforms.select(editor, initialSelection);
    };
    return editor;
};
exports.withSetTableFragmentData = withSetTableFragmentData;
