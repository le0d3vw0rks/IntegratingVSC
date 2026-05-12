"use client";

import type { DynamicToolUIPart } from "ai";
import { Loader2 } from "lucide-react";

function getFileName(path: string): string {
  return path.split("/").pop() ?? path;
}

export function getToolLabel(part: DynamicToolUIPart): string {
  const { toolName } = part;
  const input = part.input as Record<string, unknown> | undefined;
  const command = input?.command as string | undefined;
  const path = input?.path as string | undefined;
  const filename = path ? getFileName(path) : undefined;

  if (toolName === "str_replace_editor") {
    if (!command || !filename) return "Working on files…";
    switch (command) {
      case "create": return `Creating ${filename}`;
      case "str_replace":
      case "insert": return `Editing ${filename}`;
      case "view": return `Reading ${filename}`;
      case "undo_edit": return `Undoing edit on ${filename}`;
      default: return `Working on ${filename}`;
    }
  }

  if (toolName === "file_manager") {
    if (!command || !filename) return "Managing files…";
    switch (command) {
      case "rename": return `Renaming ${filename}`;
      case "delete": return `Deleting ${filename}`;
      default: return `Managing ${filename}`;
    }
  }

  return toolName;
}

interface ToolInvocationBadgeProps {
  part: DynamicToolUIPart;
}

export function ToolInvocationBadge({ part }: ToolInvocationBadgeProps) {
  const isComplete = part.state === "output-available";

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isComplete ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{getToolLabel(part)}</span>
    </div>
  );
}
