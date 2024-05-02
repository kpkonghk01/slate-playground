"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Toolbar = exports.Menu = exports.Icon = exports.Button = void 0;
const react_1 = __importDefault(require("react"));
const css_1 = require("@emotion/css");
exports.Button = react_1.default.forwardRef(({ className, active, reversed, ...props }, ref) => (react_1.default.createElement("span", { ...props, ref: ref, className: (0, css_1.cx)(className, (0, css_1.css) `
          cursor: pointer;
          color: ${reversed
        ? active
            ? "white"
            : "#aaa"
        : active
            ? "black"
            : "#ccc"};
        `) })));
exports.Icon = react_1.default.forwardRef(({ className, ...props }, ref) => (react_1.default.createElement("span", { ...props, ref: ref, className: (0, css_1.cx)("material-icons", className, (0, css_1.css) `
          font-size: 18px;
          vertical-align: text-bottom;
        `) })));
exports.Menu = react_1.default.forwardRef(({ className, ...props }, ref) => (react_1.default.createElement("div", { ...props, "data-test-id": "menu", ref: ref, className: (0, css_1.cx)(className, (0, css_1.css) `
          & > * {
            display: inline-block;
          }

          & > * + * {
            margin-left: 15px;
          }
        `) })));
exports.Toolbar = react_1.default.forwardRef(({ className, ...props }, ref) => (react_1.default.createElement(exports.Menu, { ...props, ref: ref, className: (0, css_1.cx)(className, (0, css_1.css) `
          position: relative;
          padding: 1px 18px 17px;
          margin: 0 -20px;
          border-bottom: 2px solid #eee;
          margin-bottom: 20px;
        `) })));
