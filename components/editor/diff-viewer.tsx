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
      <div className="flex items-center justify-center h-full text-body-sm text-mute">
        No changes have been made to this version yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-hairline px-5 py-2 bg-canvas">
        <h3 className="text-body-sm-strong text-ink">
          Version Diff
        </h3>
        <div className="flex items-center gap-3 text-caption-mono tabular-nums">
          <span className="text-[#0070f3] dark:text-[#3291ff] font-medium">
            +{addedCount} added
          </span>
          <span className="text-[#ee0000] dark:text-[#ff6666] font-medium">
            −{removedCount} removed
          </span>
        </div>
      </div>

      {/* Diff content */}
      <div className="flex-1 overflow-y-auto p-5 font-mono text-code leading-6">
        {diffLines.map((line, i) => (
          <div
            key={i}
            className={cn(
              "px-3 py-0.5 rounded-[4px]",
              line.type === "added" && "diff-add",
              line.type === "removed" && "diff-remove"
            )}
          >
            <span className="inline-block w-5 text-right mr-3 text-mute select-none text-[11px]">
              {line.type === "removed" ? "−" : line.type === "added" ? "+" : " "}
            </span>
            {line.text || "\u00A0"}
          </div>
        ))}
      </div>
    </div>
  );
}
