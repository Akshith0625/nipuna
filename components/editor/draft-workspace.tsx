"use client";

import { useRef, useEffect, useState, type ChangeEvent } from "react";
import { Upload, Zap, Check, Edit3, Eye } from "lucide-react";
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
    result += `<mark class="${cls}${isActive ? " highlight-active font-semibold shadow-sm" : ""}" data-finding-id="${finding.id}">${escapeHtml(text.slice(start, end))}</mark>`;

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLiveEditing, setIsLiveEditing] = useState(false);
  const hasFindings = findings.length > 0;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  // Auto-scroll to active highlighted word when selected from drawer or clicked
  useEffect(() => {
    if (!activeFindingId || !containerRef.current) return;
    const markEl = containerRef.current.querySelector(
      `[data-finding-id="${activeFindingId}"]`
    );
    if (markEl) {
      markEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeFindingId]);

  function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith(".docx")) {
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

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleHighlightClick(e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    const markEl = target.closest("[data-finding-id]") as HTMLElement | null;
    const findingId = markEl?.getAttribute("data-finding-id");
    if (findingId) {
      onFindingClick(findingId);
      markEl?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function handleTriggerRunCheck() {
    setIsLiveEditing(false);
    onRunCheck();
  }

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 px-4 py-2.5 bg-white/80 backdrop-blur-sm shadow-xs">
        {/* Left Toolbar Items */}
        <div className="flex items-center gap-2">
          <select
            onChange={(e) => {
              const idx = parseInt(e.target.value);
              if (!isNaN(idx)) {
                onLoadDraft(idx);
                setIsLiveEditing(false);
              }
            }}
            defaultValue=""
            disabled={isLocked}
            className="text-xs font-medium bg-slate-100 hover:bg-slate-200/60 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 transition-colors focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
          >
            <option value="" disabled>Load benchmark draft…</option>
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
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-all disabled:opacity-40 inline-flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-slate-600" strokeWidth={1.75} />
            <span>Upload .docx</span>
          </button>

          {/* Toggle between Highlights and Live Text Editor */}
          {hasFindings && !isLocked && (
            <button
              onClick={() => setIsLiveEditing(!isLiveEditing)}
              className={cn(
                "text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all inline-flex items-center gap-1.5",
                isLiveEditing
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-xs"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              )}
              title={isLiveEditing ? "View highlighted findings" : "Edit draft text directly"}
            >
              {isLiveEditing ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-indigo-600" strokeWidth={1.75} />
                  <span className="hidden sm:inline">Highlights View</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-3.5 h-3.5 text-slate-600" strokeWidth={1.75} />
                  <span className="hidden sm:inline">Live Edit</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Right Toolbar Items */}
        <div className="flex items-center gap-2.5">
          <span className="text-[11.5px] font-mono text-slate-500 tabular-nums bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
            {wordCount} words
          </span>

          {scanDurationMs !== undefined && (
            <span className="text-[11.5px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 tabular-nums hidden sm:inline-flex items-center gap-1">
              <Zap className="w-3 h-3 text-indigo-500" strokeWidth={1.75} />
              <span>{scanDurationMs}ms</span>
            </span>
          )}

          <button
            onClick={handleTriggerRunCheck}
            disabled={isScanning || !content.trim() || isLocked}
            className={cn(
              "btn-pill btn-pill-primary text-xs font-semibold shadow-sm shadow-indigo-500/25 inline-flex items-center gap-1.5",
              "disabled:opacity-40 disabled:cursor-not-allowed"
            )}
          >
            {isScanning ? (
              <>
                <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Checking Ground Truth…</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-white" strokeWidth={1.75} />
                <span>Run Governance Review</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Locked banner */}
      {isLocked && (
        <div className="px-5 py-2.5 bg-emerald-50 border-b border-emerald-200 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" strokeWidth={2} />
          <p className="text-xs font-semibold text-emerald-800">
            This version has been approved and locked. Create a new revision to make further changes.
          </p>
        </div>
      )}

      {/* Editor area with auto-scrolling container */}
      <div ref={containerRef} className="flex-1 overflow-auto p-4 sm:p-8">
        <div className="max-w-[760px] mx-auto min-h-full bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 sm:p-10">
          {hasFindings && !isLiveEditing ? (
            // Highlighted read view with clickable marks
            <div
              className="text-[14.5px] leading-relaxed text-slate-800 cursor-text min-h-[400px] whitespace-pre-wrap select-text"
              onClick={handleHighlightClick}
              dangerouslySetInnerHTML={{
                __html: buildHighlightedHtml(content, findings, activeFindingId),
              }}
            />
          ) : (
            // Editable textarea (active when editing or when no findings present)
            <textarea
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              disabled={isLocked}
              placeholder="Paste your draft here, upload a .docx file, or select a test draft from the toolbar above to run brand governance checks…"
              className="w-full h-full min-h-[450px] bg-transparent resize-none text-[14.5px] leading-relaxed text-slate-800 placeholder:text-slate-400 focus:outline-none disabled:opacity-60"
            />
          )}
        </div>
      </div>
    </div>
  );
}
