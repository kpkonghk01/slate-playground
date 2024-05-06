import { Editor, Range, Transforms } from "slate";
import { ReactEditor } from "slate-react";
import { getSelectedTablePath } from "./queries/getSelectedTablePath";
import { getSelectedRange } from "./queries/getSelectedRange";
import { getTableInfo } from "./queries/getTableInfo";

export const withSetTableFragmentData = (editor: ReactEditor) => {
  const { setFragmentData } = editor;

  editor.setFragmentData = (data, originEvent) => {
    const { selection } = editor;

    if (!selection) {
      // should not set anything when there is no selection
      return;
    }

    if (Range.isCollapsed(selection) || !originEvent) {
      setFragmentData(data, originEvent);

      return;
    }

    const tableRootPath = getSelectedTablePath(editor);

    if (tableRootPath == null) {
      // non selection table detected

      const cellsGenerator = Editor.nodes(editor, {
        at: selection,
        match: (n) => {
          // @ts-ignore
          return n.type === "table-cell";
        },
      });

      if (!cellsGenerator.next().done) {
        // cross table selection with table elements
        // collapse the selection to prevent insert text with cross selection
        Transforms.collapse(editor);

        // FIXME: even we prevent copy fragment data, the paste event is still triggered when drag

        return;
      }

      setFragmentData(data, originEvent);

      return;
    }

    // selection is inside a table
    const selectedRange = getSelectedRange(editor);

    if (!selectedRange) {
      setFragmentData(data, originEvent);

      return;
    }

    // cross cells selection
    const initialSelection = selection;
    const tableInfo = getTableInfo(editor, tableRootPath[0]!);
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

    Editor.withoutNormalizing(editor, () => {
      for (let rowIdx = startRow; rowIdx <= endRow; rowIdx++) {
        const row = tableRows[rowIdx]!;
        const rowCells = row.children;
        const rowPath = tableRootPath.concat(rowIdx);

        const cellStrings: string[] = [];

        // Assumption: not support th element
        const rowElement = document.createElement("tr");

        for (let colIdx = startCol; colIdx <= endCol; colIdx++) {
          const cell = rowCells[colIdx]!;

          // need to clean data before every iteration
          data.clearData();

          const cellPath = rowPath.concat(colIdx);

          // select cell by cell
          Transforms.select(editor, {
            anchor: Editor.start(editor, cellPath.concat([0, 0])),
            focus: Editor.end(
              editor,
              cellPath.concat([cell.children.length - 1, 0]),
            ),
          });

          // set data from selection
          setFragmentData(data);

          // get plain text
          console.log(data.getData("text/plain"));
          cellStrings.push(data.getData("text/plain"));

          const cellElement = document.createElement("td");

          cellElement.colSpan = cell.colSpan;
          cellElement.rowSpan = cell.rowSpan;

          cellElement.innerHTML = data.getData("text/html");
          rowElement.append(cellElement);
        }

        tableElement.append(rowElement);

        textCsv += `"${cellStrings.join('","')}"\n`;
        textTsv += `"${cellStrings.join('"\t"')}"\n`;
      }
    });

    data.setData("text/csv", textCsv);
    data.setData("text/tsv", textTsv);
    data.setData("text/plain", textTsv);
    data.setData("text/html", divElement.innerHTML);

    const selectedFragmentStr = JSON.stringify(tableNode);
    const encodedFragment = window.btoa(
      encodeURIComponent(selectedFragmentStr),
    );
    data.setData("application/x-slate-fragment", encodedFragment);

    Transforms.select(editor, initialSelection!);

    divElement.append(tableElement);
  };

  return editor;
};
