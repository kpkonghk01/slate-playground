import { ReactEditor } from "slate-react";
import { TableElement } from "../../table-types";
import { Transforms } from "slate";

export const resizeCell = (
  editor: ReactEditor,
  element: TableElement,
  tableIdx: number,
  direction: string,
  idx: number,
  span: number,
  start: number,
  end: number,
) => {
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
};
