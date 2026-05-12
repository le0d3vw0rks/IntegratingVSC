import { test, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MessageInput } from "../MessageInput";

afterEach(() => {
  cleanup();
});

test("renders with placeholder text", () => {
  render(<MessageInput onSend={vi.fn()} isLoading={false} />);
  expect(screen.getByPlaceholderText("Describe the React component you want to create...")).toBeDefined();
});

test("displays typed input value", async () => {
  render(<MessageInput onSend={vi.fn()} isLoading={false} />);
  const textarea = screen.getByRole("textbox");
  await userEvent.type(textarea, "Test input value");
  expect((textarea as HTMLTextAreaElement).value).toBe("Test input value");
});

test("calls onSend when form is submitted with input", async () => {
  const onSend = vi.fn();
  render(<MessageInput onSend={onSend} isLoading={false} />);
  const textarea = screen.getByRole("textbox");
  await userEvent.type(textarea, "Hello");
  fireEvent.submit(textarea.closest("form")!);
  expect(onSend).toHaveBeenCalledWith("Hello");
});

test("calls onSend and clears input when Enter pressed without shift", async () => {
  const onSend = vi.fn();
  render(<MessageInput onSend={onSend} isLoading={false} />);
  const textarea = screen.getByRole("textbox");
  await userEvent.type(textarea, "Test input");
  fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
  expect(onSend).toHaveBeenCalledOnce();
});

test("does not submit form when Enter is pressed with shift", async () => {
  const onSend = vi.fn();
  render(<MessageInput onSend={onSend} isLoading={false} />);
  const textarea = screen.getByRole("textbox");
  await userEvent.type(textarea, "Test input");
  fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });
  expect(onSend).not.toHaveBeenCalled();
});

test("disables textarea when isLoading is true", () => {
  render(<MessageInput onSend={vi.fn()} isLoading={true} />);
  expect(screen.getByRole("textbox")).toHaveProperty("disabled", true);
});

test("disables submit button when isLoading is true", () => {
  render(<MessageInput onSend={vi.fn()} isLoading={true} />);
  expect(screen.getByRole("button")).toHaveProperty("disabled", true);
});

test("disables submit button when input is empty", () => {
  render(<MessageInput onSend={vi.fn()} isLoading={false} />);
  expect(screen.getByRole("button")).toHaveProperty("disabled", true);
});

test("disables submit button when input contains only whitespace", async () => {
  render(<MessageInput onSend={vi.fn()} isLoading={false} />);
  await userEvent.type(screen.getByRole("textbox"), "   ");
  expect(screen.getByRole("button")).toHaveProperty("disabled", true);
});

test("enables submit button when input has content and not loading", async () => {
  render(<MessageInput onSend={vi.fn()} isLoading={false} />);
  await userEvent.type(screen.getByRole("textbox"), "Valid content");
  expect(screen.getByRole("button")).toHaveProperty("disabled", false);
});

test("applies correct CSS classes based on loading state", () => {
  const { rerender } = render(<MessageInput onSend={vi.fn()} isLoading={false} />);
  let submitButton = screen.getByRole("button");
  expect(submitButton.className).toContain("disabled:opacity-40");
  expect(submitButton.className).toContain("hover:bg-blue-50");

  rerender(<MessageInput onSend={vi.fn()} isLoading={true} />);
  submitButton = screen.getByRole("button");
  expect(submitButton.className).toContain("disabled:cursor-not-allowed");
  expect(submitButton.className).toContain("disabled:opacity-40");
});

test("applies pulse animation to send icon when loading", () => {
  const { rerender } = render(<MessageInput onSend={vi.fn()} isLoading={false} />);
  let sendIcon = screen.getByRole("button").querySelector("svg");
  expect(sendIcon?.getAttribute("class")).not.toContain("animate-pulse");

  rerender(<MessageInput onSend={vi.fn()} isLoading={true} />);
  sendIcon = screen.getByRole("button").querySelector("svg");
  expect(sendIcon?.getAttribute("class")).toContain("text-neutral-300");
});

test("textarea has correct styling classes", () => {
  render(<MessageInput onSend={vi.fn()} isLoading={false} />);
  const textarea = screen.getByRole("textbox");
  expect(textarea.className).toContain("min-h-[80px]");
  expect(textarea.className).toContain("max-h-[200px]");
  expect(textarea.className).toContain("resize-none");
  expect(textarea.className).toContain("focus:ring-2");
  expect(textarea.className).toContain("focus:ring-blue-500/10");
});

test("submit button click triggers onSend", async () => {
  const onSend = vi.fn();
  render(<MessageInput onSend={onSend} isLoading={false} />);
  await userEvent.type(screen.getByRole("textbox"), "Test input");
  await userEvent.click(screen.getByRole("button"));
  expect(onSend).toHaveBeenCalledWith("Test input");
});
