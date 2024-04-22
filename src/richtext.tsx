// https://github.com/ianstormtaylor/slate/blob/main/site/examples/richtext.tsx

import React, { useCallback, useMemo } from "react";
import isHotkey from "is-hotkey";
import { Editable, withReact, useSlate, Slate, ReactEditor } from "slate-react";
import {
  Editor,
  Transforms,
  createEditor,
  Descendant,
  Element as SlateElement,
  BaseEditor,
  Point,
  Range,
} from "slate";
import { withHistory } from "slate-history";

import { Button, Icon, Toolbar } from "./components";

const HOTKEYS = {
  "mod+b": "bold",
  "mod+i": "italic",
  "mod+u": "underline",
  "mod+`": "code",
};

const LIST_TYPES = ["numbered-list", "bulleted-list"];
const TEXT_ALIGN_TYPES = ["left", "center", "right", "justify"];

const RichTextExample = ({
  handleUpdate,
}: {
  handleUpdate?: (arg: any) => void;
}) => {
  const renderElement = useCallback((props: any) => <Element {...props} />, []);
  const renderLeaf = useCallback((props: any) => <Leaf {...props} />, []);
  const editor = useMemo(
    () => withTables(withHistory(withReact(createEditor()))),
    []
  );
  const { normalizeNode } = editor;

  editor.normalizeNode = (entry) => {
    // ref: https://github.dev/udecode/plate/blob/main/packages/table/src/withNormalizeTable.ts
    const [node, path] = entry;

    // @ts-ignore
    if (node.type === "table") {
      const tableEntry = Editor.above(editor, {
        at: path,
        // @ts-ignore
        match: (node) => node.type === "table",
      });

      if (tableEntry) {
        // remove table parent of a table
        Transforms.unwrapNodes(editor, {
          at: path,
        });
        return;
      }

      // const initialTableWidth = 630; // full width of an element in cms
      // // @ts-ignore
      // const tableNode = node;
      // const colCount = (
      //       // @ts-ignore
      //   tableNode.children[0]?.children
      // )?.length;

      // if (colCount) {
      //   const colSizes: number[] = [];

      //   if (!tableNode.data.colSizes) {
      //     for (let i = 0; i < colCount; i++) {
      //       colSizes.push(initialTableWidth / colCount);
      //     }
      //   } else if (tableNode.data.colSizes.some((size) => !size)) {
      //     tableNode.data.colSizes.forEach((colSize) => {
      //       colSizes.push(colSize || initialTableWidth / colCount);
      //     });
      //   }

      //   if (colSizes.length > 0) {
      //     Transforms.setNodes(
      //       editor,
      //       { data: { ...tableNode.data, colSizes } },
      //       { at: path }
      //     );
      //     return;
      //   }
      // }
    }

    // @ts-ignore
    if (node.type === "table-row") {
      const parentEntry = Editor.parent(editor, path);

      if (
        // @ts-ignore
        parentEntry?.[0].type !== "table"
      ) {
        // remove non table parent of tr
        Transforms.unwrapNodes(editor, {
          at: path,
        });
        return;
      }
    }

    // @ts-ignore
    if (node.type === "table-cell") {
      const parentEntry = Editor.parent(editor, path);

      if (
        // @ts-ignore
        parentEntry?.[0].type !== "table-row"
      ) {
        // remove non tr parent of td
        Transforms.unwrapNodes(editor, {
          at: path,
        });
        return;
      }

      // @ts-ignore
      // const { children } = node;

      // if (Text.isText(children[0])) {
      //   // TODO: wrap text in a paragraph
      //   console.log("paragraph", path);

      //   return;
      // }

      normalizeNode(entry);
    }
  };

  return (
    <Slate editor={editor} initialValue={initialValue} onChange={handleUpdate}>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/icon?family=Material+Icons"
      />
      <Toolbar>
        <MarkButton format="bold" icon="format_bold" />
        <MarkButton format="italic" icon="format_italic" />
        <MarkButton format="underline" icon="format_underlined" />
        <MarkButton format="code" icon="code" />
        <BlockButton format="heading-one" icon="looks_one" />
        <BlockButton format="heading-two" icon="looks_two" />
        <BlockButton format="block-quote" icon="format_quote" />
        <BlockButton format="numbered-list" icon="format_list_numbered" />
        <BlockButton format="bulleted-list" icon="format_list_bulleted" />
        <BlockButton format="left" icon="format_align_left" />
        <BlockButton format="center" icon="format_align_center" />
        <BlockButton format="right" icon="format_align_right" />
        <BlockButton format="justify" icon="format_align_justify" />
        <TableButton icon="table_view" />
      </Toolbar>
      <Editable
        style={{ padding: "8px 30px" }}
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        placeholder="Enter some rich text…"
        spellCheck
        autoFocus
        onKeyDown={(event) => {
          for (const [hotkey, mark] of Object.entries(HOTKEYS)) {
            if (isHotkey(hotkey, event as any)) {
              event.preventDefault();
              toggleMark(editor, mark);
            }
          }
        }}
      />
    </Slate>
  );
};

const withTables = (editor: ReactEditor) => {
  const { deleteBackward, deleteForward, insertBreak } = editor;

  editor.deleteBackward = (unit) => {
    const { selection } = editor;

    if (selection && Range.isCollapsed(selection)) {
      const [cell] = Editor.nodes(editor, {
        match: (n) =>
          !Editor.isEditor(n) &&
          SlateElement.isElement(n) &&
          // @ts-ignore
          n.type === "table-cell",
      });

      if (cell) {
        const [, cellPath] = cell;
        const start = Editor.start(editor, cellPath);

        if (Point.equals(selection.anchor, start)) {
          return;
        }
      }
    }

    deleteBackward(unit);
  };

  editor.deleteForward = (unit) => {
    const { selection } = editor;

    if (selection && Range.isCollapsed(selection)) {
      const [cell] = Editor.nodes(editor, {
        match: (n) =>
          !Editor.isEditor(n) &&
          SlateElement.isElement(n) &&
          // @ts-ignore
          n.type === "table-cell",
      });

      if (cell) {
        const [, cellPath] = cell;
        const end = Editor.end(editor, cellPath);

        if (Point.equals(selection.anchor, end)) {
          return;
        }
      }
    }

    deleteForward(unit);
  };

  return editor;
};

const toggleBlock = (editor: Editor, format: string) => {
  const isActive = isBlockActive(
    editor,
    format,
    TEXT_ALIGN_TYPES.includes(format) ? "align" : "type"
  );
  const isList = LIST_TYPES.includes(format);

  Transforms.unwrapNodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      // @ts-ignore
      LIST_TYPES.includes(n.type) &&
      !TEXT_ALIGN_TYPES.includes(format),
    split: true,
  });

  let newProperties: Partial<SlateElement>;
  if (TEXT_ALIGN_TYPES.includes(format)) {
    newProperties = {
      // @ts-ignore
      align: isActive ? undefined : format,
    };
  } else {
    newProperties = {
      // @ts-ignore
      type: isActive ? "paragraph" : isList ? "list-item" : format,
    };
  }

  Transforms.setNodes<SlateElement>(editor, newProperties);

  if (!isActive && isList) {
    const block = { type: format, children: [] };
    Transforms.wrapNodes(editor, block);
  }
};

const toggleTable = (editor: Editor) => {
  const isActive = isBlockActive(editor, "table");

  if (isActive) {
    return;
  }

  const table = initTable({ rows: 3, cols: 3 });
  Transforms.insertNodes(editor, table);
};

const initCell = () => {
  const col = {
    type: "table-cell",
    children: [
      {
        // @ts-ignore
        type: "paragraph",
        children: [{ text: "" }],
      },
    ],
  };

  return col;
};

const initRow = (cols: number) => {
  const row = {
    type: "table-row",
    children: [],
  };

  for (let j = 0; j < cols; j++) {
    // @ts-ignore
    row.children.push(initCell());
  }

  return row;
};

const initTable = ({
  rows = 3,
  cols = 3,
}: {
  rows?: number;
  cols?: number;
}) => {
  const table = {
    type: "table",
    children: [],
  };

  for (let i = 0; i < rows; i++) {
    // @ts-ignore
    table.children.push(initRow(cols));
  }

  return table;
};

const toggleMark = (editor: BaseEditor, format: string) => {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

const isBlockActive = (editor: BaseEditor, format: any, blockType = "type") => {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: (n) =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        // @ts-ignore
        n[blockType] === format,
    })
  );

  return !!match;
};

const isMarkActive = (editor: BaseEditor, format: string | number) => {
  const marks = Editor.marks(editor);
  // @ts-ignore
  return marks ? marks[format] === true : false;
};

// @ts-ignore
const Element = ({ attributes, children, element }) => {
  // const editor = useSlate();

  // console.log(
  //   "element:",
  //   element,
  //   ", isBlock:",
  //   Editor.isBlock(editor, element),
  //   "isElement:",
  //   SlateElement.isElement(element),
  //   "isInline",
  //   Editor.isInline(editor, element)
  // );

  const style = { textAlign: element.align };

  switch (element.type) {
    case "block-quote":
      return (
        <blockquote style={style} {...attributes}>
          {children}
        </blockquote>
      );
    case "bulleted-list":
      return (
        <ul style={style} {...attributes}>
          {children}
        </ul>
      );
    case "heading-one":
      return (
        <h1 style={style} {...attributes}>
          {children}
        </h1>
      );
    case "heading-two":
      return (
        <h2 style={style} {...attributes}>
          {children}
        </h2>
      );
    case "list-item":
      return (
        <li style={style} {...attributes}>
          {children}
        </li>
      );
    case "numbered-list":
      return (
        <ol style={style} {...attributes}>
          {children}
        </ol>
      );
    case "table":
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
    case "table-row":
      return (
        <tr style={style} {...attributes}>
          {children}
        </tr>
      );
    case "table-cell":
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
    default:
      return (
        <p style={style} {...attributes}>
          {children}
        </p>
      );
  }
};

// @ts-ignore
const Leaf = ({ attributes, children, leaf }) => {
  // const editor = useSlate();

  // console.log(
  //   "leaf:",
  //   leaf,
  //   ", isBlock:",
  //   Editor.isBlock(editor, leaf),
  //   "isElement:",
  //   SlateElement.isElement(leaf),
  //   "isInline",
  //   Editor.isInline(editor, leaf)
  // );

  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }

  if (leaf.code) {
    children = <code>{children}</code>;
  }

  if (leaf.italic) {
    children = <em>{children}</em>;
  }

  if (leaf.underline) {
    children = <u>{children}</u>;
  }

  return <span {...attributes}>{children}</span>;
};

// @ts-ignore
const BlockButton = ({ format, icon }) => {
  const editor = useSlate();
  return (
    <Button
      active={isBlockActive(
        editor,
        format,
        TEXT_ALIGN_TYPES.includes(format) ? "align" : "type"
      )}
      onMouseDown={(event: { preventDefault: () => void }) => {
        event.preventDefault();
        toggleBlock(editor, format);
      }}
    >
      <Icon>{icon}</Icon>
    </Button>
  );
};

// @ts-ignore
const TableButton = ({ icon }) => {
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

// @ts-ignore
const MarkButton = ({ format, icon }) => {
  const editor = useSlate();
  return (
    <Button
      active={isMarkActive(editor, format)}
      onMouseDown={(event: { preventDefault: () => void }) => {
        event.preventDefault();
        toggleMark(editor, format);
      }}
    >
      <Icon>{icon}</Icon>
    </Button>
  );
};

const initialValue: Descendant[] = [
  {
    // @ts-ignore
    type: "paragraph",
    children: [
      { text: "" },
      // { text: "This is editable " },
      // // @ts-ignore
      // { text: "rich", bold: true },
      // { text: " text, " },
      // // @ts-ignore
      // { text: "much", italic: true },
      // { text: " better than a " },
      // // @ts-ignore
      // { text: "<textarea>", code: true },
      // { text: "!" },
    ],
  },
  // {
  //   type: "paragraph",
  //   children: [
  //     {
  //       text: "Since it's rich text, you can do things like turn a selection of text ",
  //     },
  //     // @ts-ignore
  //     { text: "bold", bold: true },
  //     {
  //       text: ", or add a semantically rendered block quote in the middle of the page, like this:",
  //     },
  //   ],
  // },
  // {
  //   // @ts-ignore
  //   type: "block-quote",
  //   children: [{ text: "A wise quote." }],
  // },
  // {
  //   // @ts-ignore
  //   type: "paragraph",
  //   align: "center",
  //   children: [{ text: "Try it out for yourself!" }],
  // },
];

export default RichTextExample;
