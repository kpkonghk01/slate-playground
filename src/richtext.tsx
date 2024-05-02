// https://github.com/ianstormtaylor/slate/blob/main/site/examples/richtext.tsx

import React, { useCallback, useMemo } from "react";
import isHotkey from "is-hotkey";
import { Editable, withReact, useSlate, Slate } from "slate-react";
import {
  Editor,
  Transforms,
  createEditor,
  Element as SlateElement,
  BaseEditor,
} from "slate";
import { withHistory } from "slate-history";

import { Button, Icon, Toolbar } from "./components";
import { isBlockActive } from "./common-utils";
import { TableButton, TableCell, Table, TableRow } from "./TableComponents";
import { withTable } from "./table-utils";

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
    () => withTable(withHistory(withReact(createEditor()))),
    []
  );

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

const toggleMark = (editor: BaseEditor, format: string) => {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

const isMarkActive = (editor: BaseEditor, format: string | number) => {
  const marks = Editor.marks(editor);
  // @ts-ignore
  return marks ? marks[format] === true : false;
};

// @ts-ignore
const Element = ({ attributes, children, element }) => {
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
        <Table style={style} attributes={attributes} element={element}>
          {children}
        </Table>
      );
    case "table-row":
      return (
        <TableRow style={style} attributes={attributes} element={element}>
          {children}
        </TableRow>
      );
    case "table-cell":
      return (
        <TableCell style={style} attributes={attributes} element={element}>
          {children}
        </TableCell>
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

const initialValue = [
  {
    type: "paragraph",
    children: [
      {
        text: "",
      },
    ],
  },
  {
    type: "table",
    settings: {
      colSizes: [150, 150, 150, 150, 150, 150],
      rowSizes: [59.5, 59.5, 59.5, 59.5, 59.5, 59.5, 59.5],
    },
    children: [
      {
        type: "table-row",
        children: [
          {
            type: "table-cell",
            rowSpan: 1,
            colSpan: 1,
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    text: "na",
                  },
                ],
              },
            ],
          },
          {
            type: "table-cell",
            rowSpan: 1,
            colSpan: 1,
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    text: "1",
                  },
                ],
              },
            ],
          },
          {
            type: "table-cell",
            rowSpan: 1,
            colSpan: 1,
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    text: "2",
                  },
                ],
              },
            ],
          },
          {
            type: "table-cell",
            rowSpan: 1,
            colSpan: 1,
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    text: "3",
                  },
                ],
              },
            ],
          },
          {
            type: "table-cell",
            rowSpan: 1,
            colSpan: 1,
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    text: "4",
                  },
                ],
              },
            ],
          },
          {
            type: "table-cell",
            rowSpan: 1,
            colSpan: 1,
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    text: "5",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: "table-row",
        children: [
          {
            type: "table-cell",
            rowSpan: 1,
            colSpan: 1,
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    text: "a",
                  },
                ],
              },
            ],
          },
          {
            type: "table-cell",
            rowSpan: 1,
            colSpan: 1,
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    text: "a1",
                  },
                ],
              },
            ],
          },
          {
            type: "table-cell",
            rowSpan: 1,
            colSpan: 1,
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    text: "a2",
                  },
                ],
              },
            ],
          },
          {
            type: "table-cell",
            rowSpan: 1,
            colSpan: 1,
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    text: "a3",
                  },
                ],
              },
            ],
          },
          {
            type: "table-cell",
            rowSpan: 1,
            colSpan: 1,
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    text: "a4",
                  },
                ],
              },
            ],
          },
          {
            type: "table-cell",
            rowSpan: 1,
            colSpan: 1,
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    text: "a5",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: "table-row",
        children: [
          {
            type: "table-cell",
            rowSpan: 1,
            colSpan: 1,
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    text: "b",
                  },
                ],
              },
            ],
          },
          {
            type: "table-cell",
            rowSpan: 1,
            colSpan: 1,
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    text: "b1",
                  },
                ],
              },
            ],
          },
          {
            type: "table-cell",
            rowSpan: 1,
            colSpan: 1,
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    text: "b2",
                  },
                ],
              },
            ],
          },
          {
            type: "table-cell",
            rowSpan: 1,
            colSpan: 1,
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    text: "b3",
                  },
                ],
              },
            ],
          },
          {
            type: "table-cell",
            rowSpan: 1,
            colSpan: 1,
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    text: "b4",
                  },
                ],
              },
            ],
          },
          {
            type: "table-cell",
            rowSpan: 1,
            colSpan: 1,
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    text: "b5",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: "table-row",
        children: [
          {
            type: "table-cell",
            rowSpan: 1,
            colSpan: 1,
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    text: "c",
                  },
                ],
              },
            ],
          },
          {
            type: "table-cell",
            rowSpan: 1,
            colSpan: 1,
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    text: "c1",
                  },
                ],
              },
            ],
          },
          {
            type: "table-cell",
            rowSpan: 1,
            colSpan: 1,
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    text: "c2",
                  },
                ],
              },
            ],
          },
          {
            type: "table-cell",
            rowSpan: 1,
            colSpan: 1,
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    text: "c3",
                  },
                ],
              },
            ],
          },
          {
            type: "table-cell",
            rowSpan: 1,
            colSpan: 1,
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    text: "c4",
                  },
                ],
              },
            ],
          },
          {
            type: "table-cell",
            rowSpan: 1,
            colSpan: 1,
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    text: "c5",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: "table-row",
        children: [
          {
            type: "table-cell",
            rowSpan: 1,
            colSpan: 1,
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    text: "d",
                  },
                ],
              },
            ],
          },
          {
            type: "table-cell",
            rowSpan: 1,
            colSpan: 1,
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    text: "d1",
                  },
                ],
              },
            ],
          },
          {
            type: "table-cell",
            rowSpan: 1,
            colSpan: 1,
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    text: "d2",
                  },
                ],
              },
            ],
          },
          {
            type: "table-cell",
            rowSpan: 1,
            colSpan: 1,
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    text: "d3",
                  },
                ],
              },
            ],
          },
          {
            type: "table-cell",
            rowSpan: 1,
            colSpan: 1,
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    text: "d4",
                  },
                ],
              },
            ],
          },
          {
            type: "table-cell",
            rowSpan: 1,
            colSpan: 1,
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    text: "d5",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: "table-row",
        children: [
          {
            type: "table-cell",
            rowSpan: 1,
            colSpan: 1,
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    text: "e",
                  },
                ],
              },
            ],
          },
          {
            type: "table-cell",
            rowSpan: 1,
            colSpan: 1,
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    text: "e1",
                  },
                ],
              },
            ],
          },
          {
            type: "table-cell",
            rowSpan: 1,
            colSpan: 1,
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    text: "e2",
                  },
                ],
              },
            ],
          },
          {
            type: "table-cell",
            rowSpan: 1,
            colSpan: 1,
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    text: "e3",
                  },
                ],
              },
            ],
          },
          {
            type: "table-cell",
            rowSpan: 1,
            colSpan: 1,
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    text: "e4",
                  },
                ],
              },
            ],
          },
          {
            type: "table-cell",
            rowSpan: 1,
            colSpan: 1,
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    text: "e5",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: "table-row",
        children: [
          {
            type: "table-cell",
            rowSpan: 1,
            colSpan: 1,
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    text: "f",
                  },
                ],
              },
            ],
          },
          {
            type: "table-cell",
            rowSpan: 1,
            colSpan: 1,
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    text: "f1",
                  },
                ],
              },
            ],
          },
          {
            type: "table-cell",
            rowSpan: 1,
            colSpan: 1,
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    text: "f2",
                  },
                ],
              },
            ],
          },
          {
            type: "table-cell",
            rowSpan: 1,
            colSpan: 1,
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    text: "f3",
                  },
                ],
              },
            ],
          },
          {
            type: "table-cell",
            rowSpan: 1,
            colSpan: 1,
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    text: "f4",
                  },
                ],
              },
            ],
          },
          {
            type: "table-cell",
            rowSpan: 1,
            colSpan: 1,
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    text: "f5",
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

export default RichTextExample;
