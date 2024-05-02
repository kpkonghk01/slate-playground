import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";

import RichTextEditor from "../src/richtext";
import React from "react";

const meta = {
  title: "Example/Editor",
  component: () => {
    return (
      <RichTextEditor
        handleUpdate={(arg) =>
          action("Components: ")(JSON.stringify(arg, null, 2))
        }
      />
    );
  },
  parameters: {
    layout: "centered",
  },
  tags: ["editor"],
  // argTypes: {
  //   backgroundColor: { control: "color" },
  // },
} satisfies Meta<typeof RichTextEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {
  args: {},
};
