import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationBadge } from "../ToolInvocationBadge";
import type { ToolInvocation } from "ai";

afterEach(() => {
  cleanup();
});

test("shows friendly message for creating a file", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/components/Button.tsx" },
    state: "result",
    result: "Success",
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

  expect(screen.getByText("Creating /components/Button.tsx")).toBeDefined();
});

test("shows friendly message for editing a file via str_replace", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "2",
    toolName: "str_replace_editor",
    args: { command: "str_replace", path: "/App.tsx" },
    state: "result",
    result: "Success",
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

  expect(screen.getByText("Editing /App.tsx")).toBeDefined();
});

test("shows friendly message for editing a file via insert", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "3",
    toolName: "str_replace_editor",
    args: { command: "insert", path: "/App.tsx" },
    state: "result",
    result: "Success",
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

  expect(screen.getByText("Editing /App.tsx")).toBeDefined();
});

test("shows friendly message for viewing a file", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "4",
    toolName: "str_replace_editor",
    args: { command: "view", path: "/App.tsx" },
    state: "result",
    result: "file contents",
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

  expect(screen.getByText("Viewing /App.tsx")).toBeDefined();
});

test("shows friendly message for deleting a file", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "5",
    toolName: "file_manager",
    args: { command: "delete", path: "/old/File.tsx" },
    state: "result",
    result: { success: true, message: "Successfully deleted /old/File.tsx" },
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

  expect(screen.getByText("Deleting /old/File.tsx")).toBeDefined();
});

test("shows friendly message for renaming a file", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "6",
    toolName: "file_manager",
    args: {
      command: "rename",
      path: "/Old.tsx",
      new_path: "/New.tsx",
    },
    state: "result",
    result: { success: true, message: "Successfully renamed /Old.tsx to /New.tsx" },
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

  expect(screen.getByText("Renaming /Old.tsx to /New.tsx")).toBeDefined();
});

test("falls back to the tool name for unknown tools", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "7",
    toolName: "some_other_tool",
    args: {},
    state: "result",
    result: "ok",
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

  expect(screen.getByText("some_other_tool")).toBeDefined();
});

test("shows a spinner while the tool call is in progress", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "8",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/App.tsx" },
    state: "call",
  };

  const { container } = render(
    <ToolInvocationBadge toolInvocation={toolInvocation} />
  );

  expect(screen.getByText("Creating /App.tsx")).toBeDefined();
  expect(container.querySelector(".animate-spin")).not.toBeNull();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("shows a completed indicator once the tool call has a result", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "9",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/App.tsx" },
    state: "result",
    result: "Success",
  };

  const { container } = render(
    <ToolInvocationBadge toolInvocation={toolInvocation} />
  );

  expect(container.querySelector(".bg-emerald-500")).not.toBeNull();
  expect(container.querySelector(".animate-spin")).toBeNull();
});
