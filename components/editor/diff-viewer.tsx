"use client";

import { cn } from "@/lib/utils/cn";

interface DiffViewerProps {
  originalText: string;
  revisedText: string;
}

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
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-500 bg-slate-50/50">
        <span className="text-3xl mb-2">📋</span>
        <p className="text-sm font-semibold text-slate-700">No revisions detected</p>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Accept suggested fixes in the findings panel or edit your text to inspect visual line-by-line diffs.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-2.5 bg-white shadow-xs">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-slate-900">
            Version Revision Diff
          </h3>
          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            v1.0 → current
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono tabular-nums">
          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
            +{addedCount} added
          </span>
          <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-semibold">
            −{removedCount} removed
          </span>
        </div>
      </div>

      {/* Diff content in elevated container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-[760px] mx-auto bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 sm:p-6 font-mono text-xs leading-6">
          {diffLines.map((line, i) => (
            <div
              key={i}
              className={cn(
                "px-2.5 py-0.5 rounded flex items-start gap-2",
                line.type === "added" && "diff-add bg-emerald-50 text-emerald-900 font-medium",
                line.type === "removed" && "diff-remove bg-rose-50 text-rose-900",
                line.type === "same" && "text-slate-700"
              )}
            >
              <span className="inline-block w-4 text-center select-none text-[11px] font-bold opacity-60">
                {line.type === "removed" ? "−" : line.type === "added" ? "+" : " "}
              </span>
              <span className="flex-1 whitespace-pre-wrap">{line.text || "\u00A0"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
