import type { Meta, StoryObj } from "@storybook/react";

import RichTextEditor from "../src/richtext";

const meta = {
  title: "Example/Editor",
  component: RichTextEditor,
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
