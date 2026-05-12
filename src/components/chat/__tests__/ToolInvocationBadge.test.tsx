import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import type { ToolInvocation } from "ai";
import { ToolInvocationBadge, getToolLabel } from "../ToolInvocationBadge";

afterEach(() => {
  cleanup();
});

// ─── getToolLabel unit tests ───────────────────────────────────────────────

test("getToolLabel: str_replace_editor create", () => {
  const inv = { state: "call", toolCallId: "1", toolName: "str_replace_editor", args: { command: "create", path: "/src/components/Button.tsx" } } as ToolInvocation;
  expect(getToolLabel(inv)).toBe("Creating Button.tsx");
});

test("getToolLabel: str_replace_editor str_replace", () => {
  const inv = { state: "call", toolCallId: "1", toolName: "str_replace_editor", args: { command: "str_replace", path: "/src/components/Card.tsx" } } as ToolInvocation;
  expect(getToolLabel(inv)).toBe("Editing Card.tsx");
});

test("getToolLabel: str_replace_editor insert", () => {
  const inv = { state: "call", toolCallId: "1", toolName: "str_replace_editor", args: { command: "insert", path: "/src/app/page.tsx" } } as ToolInvocation;
  expect(getToolLabel(inv)).toBe("Editing page.tsx");
});

test("getToolLabel: str_replace_editor view", () => {
  const inv = { state: "call", toolCallId: "1", toolName: "str_replace_editor", args: { command: "view", path: "/src/lib/utils.ts" } } as ToolInvocation;
  expect(getToolLabel(inv)).toBe("Reading utils.ts");
});

test("getToolLabel: str_replace_editor undo_edit", () => {
  const inv = { state: "call", toolCallId: "1", toolName: "str_replace_editor", args: { command: "undo_edit", path: "/src/components/Form.tsx" } } as ToolInvocation;
  expect(getToolLabel(inv)).toBe("Undoing edit on Form.tsx");
});

test("getToolLabel: str_replace_editor partial-call with no args falls back", () => {
  const inv = { state: "partial-call", toolCallId: "1", toolName: "str_replace_editor", args: {} } as ToolInvocation;
  expect(getToolLabel(inv)).toBe("Working on files…");
});

test("getToolLabel: str_replace_editor partial-call with path but no command falls back", () => {
  const inv = { state: "partial-call", toolCallId: "1", toolName: "str_replace_editor", args: { path: "/src/components/Button.tsx" } } as ToolInvocation;
  expect(getToolLabel(inv)).toBe("Working on files…");
});

test("getToolLabel: file_manager rename", () => {
  const inv = { state: "call", toolCallId: "2", toolName: "file_manager", args: { command: "rename", path: "/src/components/OldName.tsx" } } as ToolInvocation;
  expect(getToolLabel(inv)).toBe("Renaming OldName.tsx");
});

test("getToolLabel: file_manager delete", () => {
  const inv = { state: "call", toolCallId: "2", toolName: "file_manager", args: { command: "delete", path: "/src/components/Unused.tsx" } } as ToolInvocation;
  expect(getToolLabel(inv)).toBe("Deleting Unused.tsx");
});

test("getToolLabel: file_manager partial-call with no args falls back", () => {
  const inv = { state: "partial-call", toolCallId: "2", toolName: "file_manager", args: {} } as ToolInvocation;
  expect(getToolLabel(inv)).toBe("Managing files…");
});

test("getToolLabel: unknown tool name returns raw tool name", () => {
  const inv = { state: "call", toolCallId: "3", toolName: "some_other_tool", args: {} } as ToolInvocation;
  expect(getToolLabel(inv)).toBe("some_other_tool");
});

test("getToolLabel: extracts filename from deeply nested path", () => {
  const inv = { state: "call", toolCallId: "1", toolName: "str_replace_editor", args: { command: "create", path: "/a/b/c/d/Deep.tsx" } } as ToolInvocation;
  expect(getToolLabel(inv)).toBe("Creating Deep.tsx");
});

// ─── Component rendering tests ─────────────────────────────────────────────

test("ToolInvocationBadge shows spinner when in-progress", () => {
  const inv = { state: "call", toolCallId: "1", toolName: "str_replace_editor", args: { command: "create", path: "/src/Button.tsx" } } as ToolInvocation;
  const { container } = render(<ToolInvocationBadge toolInvocation={inv} />);
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(screen.getByText("Creating Button.tsx")).toBeDefined();
});

test("ToolInvocationBadge shows green dot when completed", () => {
  const inv = { state: "result", toolCallId: "1", toolName: "str_replace_editor", args: { command: "create", path: "/src/Button.tsx" }, result: { success: true } } as ToolInvocation;
  const { container } = render(<ToolInvocationBadge toolInvocation={inv} />);
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
  expect(screen.getByText("Creating Button.tsx")).toBeDefined();
});

test("ToolInvocationBadge shows spinner when result is falsy", () => {
  const inv = { state: "result", toolCallId: "1", toolName: "str_replace_editor", args: { command: "create", path: "/src/Button.tsx" }, result: null } as ToolInvocation;
  const { container } = render(<ToolInvocationBadge toolInvocation={inv} />);
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("ToolInvocationBadge renders label for file_manager", () => {
  const inv = { state: "call", toolCallId: "2", toolName: "file_manager", args: { command: "delete", path: "/src/OldFile.tsx" } } as ToolInvocation;
  render(<ToolInvocationBadge toolInvocation={inv} />);
  expect(screen.getByText("Deleting OldFile.tsx")).toBeDefined();
});
