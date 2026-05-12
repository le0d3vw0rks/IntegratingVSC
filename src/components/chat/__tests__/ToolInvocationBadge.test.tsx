import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import type { DynamicToolUIPart } from "ai";
import { ToolInvocationBadge, getToolLabel } from "../ToolInvocationBadge";

afterEach(() => {
  cleanup();
});

function makePart(overrides: Partial<DynamicToolUIPart> & { toolName: string; input?: unknown; state?: DynamicToolUIPart["state"] }): DynamicToolUIPart {
  return {
    type: "dynamic-tool",
    toolCallId: "1",
    state: "input-available",
    input: {},
    ...overrides,
  } as DynamicToolUIPart;
}

// ─── getToolLabel unit tests ───────────────────────────────────────────────

test("getToolLabel: str_replace_editor create", () => {
  const part = makePart({ toolName: "str_replace_editor", input: { command: "create", path: "/src/components/Button.tsx" } });
  expect(getToolLabel(part)).toBe("Creating Button.tsx");
});

test("getToolLabel: str_replace_editor str_replace", () => {
  const part = makePart({ toolName: "str_replace_editor", input: { command: "str_replace", path: "/src/components/Card.tsx" } });
  expect(getToolLabel(part)).toBe("Editing Card.tsx");
});

test("getToolLabel: str_replace_editor insert", () => {
  const part = makePart({ toolName: "str_replace_editor", input: { command: "insert", path: "/src/app/page.tsx" } });
  expect(getToolLabel(part)).toBe("Editing page.tsx");
});

test("getToolLabel: str_replace_editor view", () => {
  const part = makePart({ toolName: "str_replace_editor", input: { command: "view", path: "/src/lib/utils.ts" } });
  expect(getToolLabel(part)).toBe("Reading utils.ts");
});

test("getToolLabel: str_replace_editor undo_edit", () => {
  const part = makePart({ toolName: "str_replace_editor", input: { command: "undo_edit", path: "/src/components/Form.tsx" } });
  expect(getToolLabel(part)).toBe("Undoing edit on Form.tsx");
});

test("getToolLabel: str_replace_editor streaming with no input falls back", () => {
  const part = makePart({ toolName: "str_replace_editor", state: "input-streaming", input: {} });
  expect(getToolLabel(part)).toBe("Working on files…");
});

test("getToolLabel: str_replace_editor with path but no command falls back", () => {
  const part = makePart({ toolName: "str_replace_editor", input: { path: "/src/components/Button.tsx" } });
  expect(getToolLabel(part)).toBe("Working on files…");
});

test("getToolLabel: file_manager rename", () => {
  const part = makePart({ toolCallId: "2", toolName: "file_manager", input: { command: "rename", path: "/src/components/OldName.tsx" } });
  expect(getToolLabel(part)).toBe("Renaming OldName.tsx");
});

test("getToolLabel: file_manager delete", () => {
  const part = makePart({ toolCallId: "2", toolName: "file_manager", input: { command: "delete", path: "/src/components/Unused.tsx" } });
  expect(getToolLabel(part)).toBe("Deleting Unused.tsx");
});

test("getToolLabel: file_manager streaming with no input falls back", () => {
  const part = makePart({ toolCallId: "2", toolName: "file_manager", state: "input-streaming", input: {} });
  expect(getToolLabel(part)).toBe("Managing files…");
});

test("getToolLabel: unknown tool name returns raw tool name", () => {
  const part = makePart({ toolCallId: "3", toolName: "some_other_tool" });
  expect(getToolLabel(part)).toBe("some_other_tool");
});

test("getToolLabel: extracts filename from deeply nested path", () => {
  const part = makePart({ toolName: "str_replace_editor", input: { command: "create", path: "/a/b/c/d/Deep.tsx" } });
  expect(getToolLabel(part)).toBe("Creating Deep.tsx");
});

// ─── Component rendering tests ─────────────────────────────────────────────

test("ToolInvocationBadge shows spinner when in-progress", () => {
  const part = makePart({ toolName: "str_replace_editor", state: "input-available", input: { command: "create", path: "/src/Button.tsx" } });
  const { container } = render(<ToolInvocationBadge part={part} />);
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(screen.getByText("Creating Button.tsx")).toBeDefined();
});

test("ToolInvocationBadge shows green dot when completed", () => {
  const part = makePart({ toolName: "str_replace_editor", state: "output-available", input: { command: "create", path: "/src/Button.tsx" } });
  const { container } = render(<ToolInvocationBadge part={part} />);
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
  expect(screen.getByText("Creating Button.tsx")).toBeDefined();
});

test("ToolInvocationBadge shows spinner when streaming input", () => {
  const part = makePart({ toolName: "str_replace_editor", state: "input-streaming", input: {} });
  const { container } = render(<ToolInvocationBadge part={part} />);
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("ToolInvocationBadge renders label for file_manager", () => {
  const part = makePart({ toolCallId: "2", toolName: "file_manager", input: { command: "delete", path: "/src/OldFile.tsx" } });
  render(<ToolInvocationBadge part={part} />);
  expect(screen.getByText("Deleting OldFile.tsx")).toBeDefined();
});
