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
    result += `<mark class="${cls}${isActive ? " ring-2 ring-link ring-offset-1" : ""}" data-finding-id="${finding.id}">${escapeHtml(text.slice(start, end))}</mark>`;

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
      <div className="flex items-center justify-between border-b border-hairline px-5 py-2 bg-canvas">
        <div className="flex items-center gap-2">
          <select
            onChange={(e) => {
              const idx = parseInt(e.target.value);
              if (!isNaN(idx)) onLoadDraft(idx);
            }}
            defaultValue=""
            disabled={isLocked}
            className="text-caption font-medium bg-canvas-soft-2 border border-hairline rounded-[6px] px-2 py-1.5 text-body"
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
            className="text-caption font-medium px-3 py-1.5 rounded-[6px] border border-hairline text-body hover:bg-canvas-soft-2 transition-base disabled:opacity-40"
          >
            Upload .docx
          </button>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-caption-mono text-mute tabular-nums">
            {wordCount} words
          </span>

          {scanDurationMs !== undefined && (
            <span className="text-caption-mono text-mute tabular-nums">
              {scanDurationMs}ms
            </span>
          )}

          <button
            onClick={onRunCheck}
            disabled={isScanning || !content.trim() || isLocked}
            className={cn(
              "btn-pill btn-pill-primary",
              "disabled:opacity-40 disabled:cursor-not-allowed"
            )}
          >
            {isScanning ? (
              <>
                <span className="h-3.5 w-3.5 rounded-full border-2 border-on-primary border-t-transparent animate-spin" />
                Scanning…
              </>
            ) : (
              "Run Governance Review"
            )}
          </button>
        </div>
      </div>

      {/* Locked banner */}
      {isLocked && (
        <div className="px-5 py-2.5 bg-[#f0fdf4] dark:bg-[rgba(5,150,105,0.08)] border-b border-[#bbf7d0] dark:border-[rgba(5,150,105,0.2)]">
          <p className="text-caption font-medium text-[#166534] dark:text-[#86efac]">
            ✓ This version has been approved and locked. Create a new version to make further changes.
          </p>
        </div>
      )}

      {/* Editor area */}
      <div className="flex-1 overflow-auto">
        {hasFindings ? (
          // Highlighted read view
          <div
            className="p-8 text-body-sm leading-7 text-ink cursor-text min-h-full whitespace-pre-wrap max-w-[720px] mx-auto"
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
            className="w-full h-full p-8 bg-transparent resize-none text-body-sm leading-7 text-ink placeholder:text-mute focus:outline-none disabled:opacity-60 max-w-[720px] mx-auto block"
          />
        )}
      </div>
    </div>
  );
}
