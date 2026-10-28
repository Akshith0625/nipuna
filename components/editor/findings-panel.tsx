"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import type {
  Finding,
  FindingCategory,
  EvidenceStatus,
  DismissalReason,
} from "@/lib/engine/types";

/* ---------- Types ---------- */

interface FindingsPanelProps {
  findings: Finding[];
  activeFindingId: string | null;
  onFindingSelect: (id: string) => void;
  onAcceptFix: (id: string) => void;
  onDismiss: (id: string, reason: DismissalReason) => void;
  onUndoAccept: (id: string) => void;
  role: "creator" | "reviewer" | "admin";
  isLocked: boolean;
}

type CategoryFilter = "all" | FindingCategory;
type EvidenceFilter = "all" | "actionable" | EvidenceStatus;

/* ---------- Config ---------- */

const CATEGORY_LABELS: Record<FindingCategory, string> = {
  terminology: "Terminology",
  claim: "Claims",
  tone: "Tone",
  policy: "Policy",
};

const EVIDENCE_LABELS: Record<EvidenceStatus, string> = {
  rule_match: "Rule Match",
  conflict: "Conflict",
  not_verified: "Not Verified",
  supported: "Verified",
  tone_heuristic: "Tone Heuristic",
};

const SEVERITY_COLORS: Record<string, string> = {
  high: "bg-[#f7d4d6] text-[#c50000] dark:bg-[rgba(238,0,0,0.12)] dark:text-[#ff6666]",
  medium: "bg-[#ffefcf] text-[#ab570a] dark:bg-[rgba(245,166,35,0.12)] dark:text-[#f5a623]",
  low: "bg-[#d3e5ff] text-[#0761d1] dark:bg-[rgba(0,112,243,0.12)] dark:text-[#3291ff]",
};

const EVIDENCE_COLORS: Record<EvidenceStatus, string> = {
  conflict: "text-[#ee0000] dark:text-[#ff6666]",
  not_verified: "text-[#ab570a] dark:text-[#f5a623]",
  rule_match: "text-[#888888] dark:text-[#a1a1a1]",
  supported: "text-[#0761d1] dark:text-[#3291ff]",
  tone_heuristic: "text-[#7928ca] dark:text-[#b36aff]",
};

const DISMISSAL_REASONS: { value: DismissalReason; label: string }[] = [
  { value: "contextually_valid", label: "Contextually valid" },
  { value: "exception_granted", label: "Exception granted" },
  { value: "false_positive", label: "False positive" },
  { value: "rule_outdated", label: "Rule is outdated" },
];

/* ---------- Component ---------- */

export default function FindingsPanel({
  findings,
  activeFindingId,
  onFindingSelect,
  onAcceptFix,
  onDismiss,
  onUndoAccept,
  role,
  isLocked,
}: FindingsPanelProps) {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [evidenceFilter, setEvidenceFilter] = useState<EvidenceFilter>("actionable");
  const [dismissingId, setDismissingId] = useState<string | null>(null);

  // Filter findings
  const filtered = findings.filter((f) => {
    if (categoryFilter !== "all" && f.category !== categoryFilter) return false;
    if (evidenceFilter === "actionable") {
      return f.evidenceStatus !== "supported";
    }
    if (evidenceFilter !== "all" && f.evidenceStatus !== evidenceFilter) return false;
    return true;
  });

  const actionableCount = findings.filter(
    (f) => f.evidenceStatus !== "supported" && f.decision === "pending"
  ).length;
  const resolvedCount = findings.filter(
    (f) => f.decision !== "pending"
  ).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-hairline px-5 py-3">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-body-sm-strong text-ink">
            Findings
          </h2>
          <div className="flex items-center gap-2 text-caption-mono tabular-nums">
            <span className="text-[#ee0000] dark:text-[#ff6666] font-medium">
              {actionableCount} open
            </span>
            <span className="text-hairline-strong">·</span>
            <span className="text-[#0070f3] dark:text-[#3291ff] font-medium">
              {resolvedCount} resolved
            </span>
            <span className="text-hairline-strong">·</span>
            <span className="text-mute font-medium">
              {findings.length} total
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1 flex-wrap">
          {/* Category filters */}
          {(["all", "terminology", "claim", "tone", "policy"] as CategoryFilter[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                "px-2 py-[3px] text-caption font-medium rounded-[4px] transition-base",
                categoryFilter === cat
                  ? "bg-accent text-on-primary"
                  : "text-mute hover:text-body hover:bg-canvas-soft-2"
              )}
            >
              {cat === "all" ? "All" : CATEGORY_LABELS[cat]}
            </button>
          ))}

          <span className="text-hairline mx-0.5">|</span>

          {/* Evidence filters */}
          {(["actionable", "all", "conflict", "not_verified", "rule_match", "supported"] as EvidenceFilter[]).map((ev) => (
            <button
              key={ev}
              onClick={() => setEvidenceFilter(ev)}
              className={cn(
                "px-2 py-[3px] text-caption font-medium rounded-[4px] transition-base",
                evidenceFilter === ev
                  ? "bg-accent text-on-primary"
                  : "text-mute hover:text-body hover:bg-canvas-soft-2"
              )}
            >
              {ev === "actionable"
                ? "Actionable"
                : ev === "all"
                ? "All"
                : EVIDENCE_LABELS[ev as EvidenceStatus]}
            </button>
          ))}
        </div>
      </div>

      {/* Finding list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-body-sm text-mute">
            {findings.length === 0
              ? "Run a governance review to see findings"
              : "No findings match the current filter"}
          </div>
        ) : (
          <div className="divide-y divide-hairline">
            {filtered.map((finding) => (
              <FindingCard
                key={finding.id}
                finding={finding}
                isActive={finding.id === activeFindingId}
                isDismissing={finding.id === dismissingId}
                onSelect={() => onFindingSelect(finding.id)}
                onAccept={() => onAcceptFix(finding.id)}
                onStartDismiss={() => setDismissingId(finding.id)}
                onCancelDismiss={() => setDismissingId(null)}
                onConfirmDismiss={(reason) => {
                  onDismiss(finding.id, reason);
                  setDismissingId(null);
                }}
                onUndo={() => onUndoAccept(finding.id)}
                isLocked={isLocked}
                role={role}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Finding Card ---------- */

interface FindingCardProps {
  finding: Finding;
  isActive: boolean;
  isDismissing: boolean;
  onSelect: () => void;
  onAccept: () => void;
  onStartDismiss: () => void;
  onCancelDismiss: () => void;
  onConfirmDismiss: (reason: DismissalReason) => void;
  onUndo: () => void;
  isLocked: boolean;
  role: string;
}

function FindingCard({
  finding,
  isActive,
  isDismissing,
  onSelect,
  onAccept,
  onStartDismiss,
  onCancelDismiss,
  onConfirmDismiss,
  onUndo,
  isLocked,
}: FindingCardProps) {
  const isResolved = finding.decision !== "pending";
  const [selectedReason, setSelectedReason] = useState<DismissalReason>("contextually_valid");

  return (
    <div
      onClick={onSelect}
      className={cn(
        "px-5 py-3 cursor-pointer transition-base",
        isActive && "bg-canvas-soft-2",
        isResolved && "opacity-55"
      )}
    >
      {/* Top row — severity badge + evidence status + rule ID */}
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className={cn(
            "px-1.5 py-0.5 text-[10px] font-semibold uppercase rounded-[4px]",
            SEVERITY_COLORS[finding.severity]
          )}
        >
          {finding.severity}
        </span>
        <span
          className={cn(
            "text-caption font-medium",
            EVIDENCE_COLORS[finding.evidenceStatus]
          )}
        >
          {EVIDENCE_LABELS[finding.evidenceStatus]}
        </span>
        {finding.ruleId && (
          <span className="text-code text-mute bg-canvas-soft-2 px-1.5 py-0.5 rounded-[4px]">
            {finding.ruleId}
          </span>
        )}
        {finding.sourceId && (
          <span className="text-code text-mute bg-canvas-soft-2 px-1.5 py-0.5 rounded-[4px]">
            {finding.sourceId}
          </span>
        )}
        {isResolved && (
          <span
            className={cn(
              "text-[10px] font-semibold uppercase ml-auto",
              finding.decision === "accepted"
                ? "text-[#0070f3] dark:text-[#3291ff]"
                : "text-mute"
            )}
          >
            {finding.decision === "accepted" ? "✓ Fixed" : "✕ Dismissed"}
          </span>
        )}
      </div>

      {/* Matched text */}
      <p className="text-caption font-medium text-ink mb-1 truncate">
        &ldquo;{finding.matchedText}&rdquo;
      </p>

      {/* Explanation */}
      <p className="text-caption text-body leading-5 mb-2">
        {finding.explanation}
      </p>

      {/* Suggested fix */}
      {finding.suggestedFix && finding.decision === "pending" && (
        <div className="mb-2 px-3 py-2 bg-canvas-soft-2 rounded-[6px] border border-hairline">
          <p className="text-[11px] text-mute font-medium mb-0.5">Suggested correction:</p>
          <p className="text-caption font-medium text-ink">
            {finding.suggestedFix}
          </p>
          {finding.intentRationale && (
            <p className="text-[11px] text-mute mt-1 italic">
              {finding.intentRationale}
            </p>
          )}
        </div>
      )}

      {/* Dismissal reasons */}
      {isDismissing && (
        <div className="mb-2 px-3 py-2 bg-canvas-soft-2 rounded-[6px] border border-hairline">
          <p className="text-[11px] text-mute font-medium mb-1.5">
            Select dismissal reason:
          </p>
          <div className="flex flex-col gap-1 mb-2">
            {DISMISSAL_REASONS.map((r) => (
              <label key={r.value} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name={`dismiss-${finding.id}`}
                  checked={selectedReason === r.value}
                  onChange={() => setSelectedReason(r.value)}
                  className="accent-accent"
                />
                <span className="text-caption text-body">{r.label}</span>
              </label>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onConfirmDismiss(selectedReason);
              }}
              className="text-caption font-semibold px-2.5 py-1 rounded-[6px] bg-canvas-soft-2 border border-hairline-strong text-ink hover:bg-hairline transition-base"
            >
              Confirm Dismiss
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCancelDismiss();
              }}
              className="text-caption font-medium px-2.5 py-1 text-mute hover:text-body transition-base"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!isLocked && !isDismissing && (
        <div className="flex items-center gap-1.5">
          {finding.decision === "pending" && finding.suggestedFix && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAccept();
              }}
              className="text-caption font-semibold px-3 py-1 rounded-[100px] bg-accent text-on-primary hover:bg-accent-hover transition-base"
            >
              Accept Fix
            </button>
          )}
          {finding.decision === "pending" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartDismiss();
              }}
              className="text-caption font-medium px-3 py-1 rounded-[100px] border border-hairline text-body hover:bg-canvas-soft-2 transition-base"
            >
              Dismiss
            </button>
          )}
          {finding.decision === "accepted" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUndo();
              }}
              className="text-caption font-medium px-3 py-1 rounded-[100px] border border-hairline text-body hover:bg-canvas-soft-2 transition-base"
            >
              Undo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
