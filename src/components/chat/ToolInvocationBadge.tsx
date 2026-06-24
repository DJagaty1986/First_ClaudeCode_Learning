"use client";

import type { ToolInvocation } from "ai";
import { Loader2 } from "lucide-react";

interface ToolInvocationBadgeProps {
  toolInvocation: ToolInvocation;
}

function getToolInvocationMessage(toolInvocation: ToolInvocation): string {
  const { toolName, args } = toolInvocation;
  const path = args?.path as string | undefined;

  if (toolName === "str_replace_editor") {
    switch (args?.command) {
      case "create":
        return path ? `Creating ${path}` : "Creating file";
      case "str_replace":
      case "insert":
        return path ? `Editing ${path}` : "Editing file";
      case "view":
        return path ? `Viewing ${path}` : "Viewing file";
      case "undo_edit":
        return path ? `Undoing edit to ${path}` : "Undoing edit";
      default:
        return path ? `Modifying ${path}` : "Modifying file";
    }
  }

  if (toolName === "file_manager") {
    const newPath = args?.new_path as string | undefined;
    switch (args?.command) {
      case "rename":
        return path && newPath
          ? `Renaming ${path} to ${newPath}`
          : "Renaming file";
      case "delete":
        return path ? `Deleting ${path}` : "Deleting file";
      default:
        return path ? `Modifying ${path}` : "Modifying file";
    }
  }

  return toolName;
}

export function ToolInvocationBadge({ toolInvocation }: ToolInvocationBadgeProps) {
  const isComplete = toolInvocation.state === "result" && "result" in toolInvocation && toolInvocation.result;
  const message = getToolInvocationMessage(toolInvocation);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isComplete ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{message}</span>
    </div>
  );
}
