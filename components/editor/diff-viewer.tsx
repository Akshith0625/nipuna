"use client";

import { cn } from "@/lib/utils/cn";

interface DiffViewerProps {
  originalText: string;
  revisedText: string;
}

/**
 * Simple line-by-line diff viewer.
 * For a hackathon prototype this is a clean, readable approach.
 */
export default function DiffViewer({ originalText, revisedText }: DiffViewerProps) {
  const originalLines = originalText.split("\n");
  const revisedLines = revisedText.split("\n");
  const maxLines = Math.max(originalLines.length, revisedLines.length);

  // Build unified diff
  const diffLines: { type: "same" | "removed" | "added"; text: string }[] = [];

  for (let i = 0; i < maxLines; i++) {
    const orig = originalLines[i] ?? "";
    const rev = revisedLines[i] ?? "";

    if (orig === rev) {
      diffLines.push({ type: "same", text: orig });
    } else {
      if (orig) diffLines.push({ type: "removed", text: orig });
      if (rev) diffLines.push({ type: "added", text: rev });
    }
  }

  const addedCount = diffLines.filter((d) => d.type === "added").length;
  const removedCount = diffLines.filter((d) => d.type === "removed").length;

  if (originalText === revisedText) {
    return (
      <div className="flex items-center justify-center h-full text-[13px] text-text-muted">
        No changes have been made to this version yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2 bg-surface">
        <h3 className="text-[13px] font-semibold text-text-primary">
          Version Diff
        </h3>
        <div className="flex items-center gap-2 text-[11px] tabular-nums">
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
            +{addedCount} added
          </span>
          <span className="text-rose-600 dark:text-rose-400 font-medium">
            −{removedCount} removed
          </span>
        </div>
      </div>

      {/* Diff content */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-[13px] leading-6">
        {diffLines.map((line, i) => (
          <div
            key={i}
            className={cn(
              "px-3 py-0.5 rounded-sm",
              line.type === "added" && "diff-add",
              line.type === "removed" && "diff-remove"
            )}
          >
            <span className="inline-block w-5 text-right mr-3 text-text-muted select-none text-[11px]">
              {line.type === "removed" ? "−" : line.type === "added" ? "+" : " "}
            </span>
            {line.text || "\u00A0"}
          </div>
        ))}
      </div>
    </div>
  );
}
