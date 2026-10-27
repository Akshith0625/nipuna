"use client";

import { useRef, type ChangeEvent } from "react";
import { cn } from "@/lib/utils/cn";
import type { Finding, EvidenceStatus } from "@/lib/engine/types";

interface DraftWorkspaceProps {
  content: string;
  onContentChange: (content: string) => void;
  findings: Finding[];
  activeFindingId: string | null;
  onFindingClick: (id: string) => void;
  onRunCheck: () => void;
  onLoadDraft: (index: number) => void;
  onDocxUpload: (text: string) => void;
  draftOptions: { title: string; description: string }[];
  isScanning: boolean;
  scanDurationMs?: number;
  isLocked: boolean;
}

const EVIDENCE_HIGHLIGHT_CLASS: Record<EvidenceStatus, string> = {
  conflict: "highlight-conflict",
  not_verified: "highlight-not-verified",
  rule_match: "highlight-rule-match",
  supported: "highlight-supported",
  tone_heuristic: "highlight-tone-heuristic",
};

/**
 * Build highlighted HTML from text content and findings.
 */
function buildHighlightedHtml(
  text: string,
  findings: Finding[],
  activeFindingId: string | null
): string {
  if (findings.length === 0) {
    return escapeHtml(text).replace(/\n/g, "<br/>");
  }

  // Sort by span start, take only actionable findings
  const actionable = findings
    .filter((f) => f.evidenceStatus !== "supported" && f.decision === "pending")
    .sort((a, b) => a.span[0] - b.span[0]);

  if (actionable.length === 0) {
    return escapeHtml(text).replace(/\n/g, "<br/>");
  }

  let result = "";
  let lastIndex = 0;

  for (const finding of actionable) {
    const [start, end] = finding.span;
    if (start < lastIndex) continue; // Skip overlapping

    // Text before the highlight
    result += escapeHtml(text.slice(lastIndex, start)).replace(/\n/g, "<br/>");

    // Highlighted span
    const cls = EVIDENCE_HIGHLIGHT_CLASS[finding.evidenceStatus] || "highlight-rule-match";
    const isActive = finding.id === activeFindingId;
    result += `<mark class="${cls}${isActive ? " ring-2 ring-accent ring-offset-1" : ""}" data-finding-id="${finding.id}">${escapeHtml(text.slice(start, end))}</mark>`;

    lastIndex = end;
  }

  // Remaining text
  result += escapeHtml(text.slice(lastIndex)).replace(/\n/g, "<br/>");

  return result;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default function DraftWorkspace({
  content,
  onContentChange,
  findings,
  activeFindingId,
  onFindingClick,
  onRunCheck,
  onLoadDraft,
  onDocxUpload,
  draftOptions,
  isScanning,
  scanDurationMs,
  isLocked,
}: DraftWorkspaceProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasFindings = findings.length > 0;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith(".docx")) {
      // Dynamic import mammoth for DOCX parsing
      import("mammoth").then((mammoth) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const result = await mammoth.extractRawText({ arrayBuffer });
          onDocxUpload(result.value);
        };
        reader.readAsArrayBuffer(file);
      });
    } else if (file.name.endsWith(".txt")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onDocxUpload(event.target?.result as string);
      };
      reader.readAsText(file);
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleHighlightClick(e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    const findingId = target.closest("[data-finding-id]")?.getAttribute("data-finding-id");
    if (findingId) {
      onFindingClick(findingId);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2 bg-surface">
        <div className="flex items-center gap-2">
          <select
            onChange={(e) => {
              const idx = parseInt(e.target.value);
              if (!isNaN(idx)) onLoadDraft(idx);
            }}
            defaultValue=""
            disabled={isLocked}
            className="text-[12px] font-medium bg-surface-raised border border-border-subtle rounded-md px-2 py-1 text-text-secondary"
          >
            <option value="" disabled>Load test draft…</option>
            {draftOptions.map((d, i) => (
              <option key={i} value={i}>{d.title}</option>
            ))}
          </select>

          <input
            ref={fileInputRef}
            type="file"
            accept=".docx,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLocked}
            className="text-[12px] font-medium px-2.5 py-1 rounded-md border border-border-subtle text-text-secondary hover:bg-surface-raised transition-base disabled:opacity-40"
          >
            Upload .docx
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-text-muted tabular-nums">
            {wordCount} words
          </span>

          {scanDurationMs !== undefined && (
            <span className="text-[11px] text-text-muted tabular-nums">
              {scanDurationMs}ms
            </span>
          )}

          <button
            onClick={onRunCheck}
            disabled={isScanning || !content.trim() || isLocked}
            className={cn(
              "text-[12px] font-semibold px-3.5 py-1.5 rounded-md transition-base",
              "bg-accent text-white dark:text-background hover:bg-accent-hover",
              "disabled:opacity-40 disabled:cursor-not-allowed"
            )}
          >
            {isScanning ? "Scanning…" : "Run Governance Review"}
          </button>
        </div>
      </div>

      {/* Locked banner */}
      {isLocked && (
        <div className="px-4 py-2 bg-green-50 dark:bg-green-950/30 border-b border-green-200 dark:border-green-900">
          <p className="text-[12px] text-green-800 dark:text-green-300 font-medium">
            ✓ This version has been approved and locked. Create a new version to make further changes.
          </p>
        </div>
      )}

      {/* Editor area */}
      <div className="flex-1 overflow-auto">
        {hasFindings ? (
          // Highlighted read view
          <div
            className="p-6 font-sans text-[14px] leading-7 text-text-primary cursor-text min-h-full whitespace-pre-wrap"
            onClick={handleHighlightClick}
            dangerouslySetInnerHTML={{
              __html: buildHighlightedHtml(content, findings, activeFindingId),
            }}
          />
        ) : (
          // Editable textarea
          <textarea
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            disabled={isLocked}
            placeholder="Paste your draft here, upload a .docx file, or select a test draft from the toolbar above…"
            className="w-full h-full p-6 bg-transparent resize-none font-sans text-[14px] leading-7 text-text-primary placeholder:text-text-muted focus:outline-none disabled:opacity-60"
          />
        )}
      </div>
    </div>
  );
}
