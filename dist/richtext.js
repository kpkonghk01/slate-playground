"use strict";
// https://github.com/ianstormtaylor/slate/blob/main/site/examples/richtext.tsx
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const is_hotkey_1 = __importDefault(require("is-hotkey"));
const slate_react_1 = require("slate-react");
const slate_1 = require("slate");
const slate_history_1 = require("slate-history");
const components_1 = require("./components");
const common_utils_1 = require("./common-utils");
const TableComponents_1 = require("./TableComponents");
const table_utils_1 = require("./table-utils");
const HOTKEYS = {
    "mod+b": "bold",
    "mod+i": "italic",
    "mod+u": "underline",
    "mod+`": "code",
};
const LIST_TYPES = ["numbered-list", "bulleted-list"];
const TEXT_ALIGN_TYPES = ["left", "center", "right", "justify"];
const RichTextExample = ({ handleUpdate, }) => {
    const renderElement = (0, react_1.useCallback)((props) => react_1.default.createElement(Element, { ...props }), []);
    const renderLeaf = (0, react_1.useCallback)((props) => react_1.default.createElement(Leaf, { ...props }), []);
    const editor = (0, react_1.useMemo)(() => (0, table_utils_1.withTable)((0, slate_history_1.withHistory)((0, slate_react_1.withReact)((0, slate_1.createEditor)()))), []);
    return (react_1.default.createElement(slate_react_1.Slate, { editor: editor, initialValue: initialValue, onChange: handleUpdate },
        react_1.default.createElement("link", { rel: "stylesheet", href: "https://fonts.googleapis.com/icon?family=Material+Icons" }),
        react_1.default.createElement(components_1.Toolbar, null,
            react_1.default.createElement(MarkButton, { format: "bold", icon: "format_bold" }),
            react_1.default.createElement(MarkButton, { format: "italic", icon: "format_italic" }),
            react_1.default.createElement(MarkButton, { format: "underline", icon: "format_underlined" }),
            react_1.default.createElement(MarkButton, { format: "code", icon: "code" }),
            react_1.default.createElement(BlockButton, { format: "heading-one", icon: "looks_one" }),
            react_1.default.createElement(BlockButton, { format: "heading-two", icon: "looks_two" }),
            react_1.default.createElement(BlockButton, { format: "block-quote", icon: "format_quote" }),
            react_1.default.createElement(BlockButton, { format: "numbered-list", icon: "format_list_numbered" }),
            react_1.default.createElement(BlockButton, { format: "bulleted-list", icon: "format_list_bulleted" }),
            react_1.default.createElement(BlockButton, { format: "left", icon: "format_align_left" }),
            react_1.default.createElement(BlockButton, { format: "center", icon: "format_align_center" }),
            react_1.default.createElement(BlockButton, { format: "right", icon: "format_align_right" }),
            react_1.default.createElement(BlockButton, { format: "justify", icon: "format_align_justify" }),
            react_1.default.createElement(TableComponents_1.TableButton, { icon: "table_view" })),
        react_1.default.createElement(slate_react_1.Editable, { style: { padding: "8px 30px" }, renderElement: renderElement, renderLeaf: renderLeaf, placeholder: "Enter some rich text\u2026", spellCheck: true, autoFocus: true, onKeyDown: (event) => {
                for (const [hotkey, mark] of Object.entries(HOTKEYS)) {
                    if ((0, is_hotkey_1.default)(hotkey, event)) {
                        event.preventDefault();
                        toggleMark(editor, mark);
                    }
                }
            } })));
};
const toggleBlock = (editor, format) => {
    const isActive = (0, common_utils_1.isBlockActive)(editor, format, TEXT_ALIGN_TYPES.includes(format) ? "align" : "type");
    const isList = LIST_TYPES.includes(format);
    slate_1.Transforms.unwrapNodes(editor, {
        match: (n) => !slate_1.Editor.isEditor(n) &&
            slate_1.Element.isElement(n) &&
            // @ts-ignore
            LIST_TYPES.includes(n.type) &&
            !TEXT_ALIGN_TYPES.includes(format),
        split: true,
    });
    let newProperties;
    if (TEXT_ALIGN_TYPES.includes(format)) {
        newProperties = {
            // @ts-ignore
            align: isActive ? undefined : format,
        };
    }
    else {
        newProperties = {
            // @ts-ignore
            type: isActive ? "paragraph" : isList ? "list-item" : format,
        };
    }
    slate_1.Transforms.setNodes(editor, newProperties);
    if (!isActive && isList) {
        const block = { type: format, children: [] };
        slate_1.Transforms.wrapNodes(editor, block);
    }
};
const toggleMark = (editor, format) => {
    const isActive = isMarkActive(editor, format);
    if (isActive) {
        slate_1.Editor.removeMark(editor, format);
    }
    else {
        slate_1.Editor.addMark(editor, format, true);
    }
};
const isMarkActive = (editor, format) => {
    const marks = slate_1.Editor.marks(editor);
    // @ts-ignore
    return marks ? marks[format] === true : false;
};
// @ts-ignore
const Element = ({ attributes, children, element }) => {
    const style = { textAlign: element.align };
    switch (element.type) {
        case "block-quote":
            return (react_1.default.createElement("blockquote", { style: style, ...attributes }, children));
        case "bulleted-list":
            return (react_1.default.createElement("ul", { style: style, ...attributes }, children));
        case "heading-one":
            return (react_1.default.createElement("h1", { style: style, ...attributes }, children));
        case "heading-two":
            return (react_1.default.createElement("h2", { style: style, ...attributes }, children));
        case "list-item":
            return (react_1.default.createElement("li", { style: style, ...attributes }, children));
        case "numbered-list":
            return (react_1.default.createElement("ol", { style: style, ...attributes }, children));
        case "table":
            return (react_1.default.createElement(TableComponents_1.Table, { style: style, attributes: attributes, element: element }, children));
        case "table-row":
            return (react_1.default.createElement(TableComponents_1.TableRow, { style: style, attributes: attributes, element: element }, children));
        case "table-cell":
            return (react_1.default.createElement(TableComponents_1.TableCell, { style: style, attributes: attributes, element: element }, children));
        default:
            return (react_1.default.createElement("p", { style: style, ...attributes }, children));
    }
};
// @ts-ignore
const Leaf = ({ attributes, children, leaf }) => {
    if (leaf.bold) {
        children = react_1.default.createElement("strong", null, children);
    }
    if (leaf.code) {
        children = react_1.default.createElement("code", null, children);
    }
    if (leaf.italic) {
        children = react_1.default.createElement("em", null, children);
    }
    if (leaf.underline) {
        children = react_1.default.createElement("u", null, children);
    }
    return react_1.default.createElement("span", { ...attributes }, children);
};
// @ts-ignore
const BlockButton = ({ format, icon }) => {
    const editor = (0, slate_react_1.useSlate)();
    return (react_1.default.createElement(components_1.Button, { active: (0, common_utils_1.isBlockActive)(editor, format, TEXT_ALIGN_TYPES.includes(format) ? "align" : "type"), onMouseDown: (event) => {
            event.preventDefault();
            toggleBlock(editor, format);
        } },
        react_1.default.createElement(components_1.Icon, null, icon)));
};
// @ts-ignore
const MarkButton = ({ format, icon }) => {
    const editor = (0, slate_react_1.useSlate)();
    return (react_1.default.createElement(components_1.Button, { active: isMarkActive(editor, format), onMouseDown: (event) => {
            event.preventDefault();
            toggleMark(editor, format);
        } },
        react_1.default.createElement(components_1.Icon, null, icon)));
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
exports.default = RichTextExample;
