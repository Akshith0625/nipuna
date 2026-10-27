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
  high: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
};

const EVIDENCE_COLORS: Record<EvidenceStatus, string> = {
  conflict: "text-rose-700 dark:text-rose-400",
  not_verified: "text-amber-700 dark:text-amber-400",
  rule_match: "text-stone-700 dark:text-stone-400",
  supported: "text-emerald-700 dark:text-emerald-400",
  tone_heuristic: "text-slate-600 dark:text-slate-400",
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
    <div className="flex flex-col h-full border-l border-border-subtle bg-surface">
      {/* Header */}
      <div className="border-b border-border-subtle px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[13px] font-semibold text-text-primary">
            Findings
          </h2>
          <div className="flex items-center gap-2 text-[11px] tabular-nums">
            <span className="text-rose-600 dark:text-rose-400 font-medium">
              {actionableCount} open
            </span>
            <span className="text-text-muted">·</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              {resolvedCount} resolved
            </span>
            <span className="text-text-muted">·</span>
            <span className="text-text-muted font-medium">
              {findings.length} total
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Category filters */}
          {(["all", "terminology", "claim", "tone", "policy"] as CategoryFilter[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                "px-2 py-0.5 text-[11px] font-medium rounded transition-base",
                categoryFilter === cat
                  ? "bg-accent text-white dark:text-background"
                  : "text-text-muted hover:text-text-secondary hover:bg-surface-raised"
              )}
            >
              {cat === "all" ? "All" : CATEGORY_LABELS[cat]}
            </button>
          ))}

          <span className="text-border-default mx-0.5">|</span>

          {/* Evidence filters */}
          {(["actionable", "all", "conflict", "not_verified", "rule_match", "supported"] as EvidenceFilter[]).map((ev) => (
            <button
              key={ev}
              onClick={() => setEvidenceFilter(ev)}
              className={cn(
                "px-2 py-0.5 text-[11px] font-medium rounded transition-base",
                evidenceFilter === ev
                  ? "bg-accent text-white dark:text-background"
                  : "text-text-muted hover:text-text-secondary hover:bg-surface-raised"
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
          <div className="flex items-center justify-center h-40 text-[13px] text-text-muted">
            {findings.length === 0
              ? "Run a governance review to see findings"
              : "No findings match the current filter"}
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
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
        "px-4 py-3 cursor-pointer transition-base",
        isActive && "bg-surface-raised",
        isResolved && "opacity-60"
      )}
    >
      {/* Top row — severity badge + evidence status + rule ID */}
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className={cn(
            "px-1.5 py-0.5 text-[10px] font-semibold uppercase rounded",
            SEVERITY_COLORS[finding.severity]
          )}
        >
          {finding.severity}
        </span>
        <span
          className={cn(
            "text-[11px] font-medium",
            EVIDENCE_COLORS[finding.evidenceStatus]
          )}
        >
          {EVIDENCE_LABELS[finding.evidenceStatus]}
        </span>
        {finding.ruleId && (
          <span className="text-[10px] font-mono text-text-muted bg-surface-raised px-1.5 py-0.5 rounded">
            {finding.ruleId}
          </span>
        )}
        {finding.sourceId && (
          <span className="text-[10px] font-mono text-text-muted bg-surface-raised px-1.5 py-0.5 rounded">
            {finding.sourceId}
          </span>
        )}
        {isResolved && (
          <span
            className={cn(
              "text-[10px] font-semibold uppercase ml-auto",
              finding.decision === "accepted"
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-stone-500"
            )}
          >
            {finding.decision === "accepted" ? "✓ Fixed" : "✕ Dismissed"}
          </span>
        )}
      </div>

      {/* Matched text */}
      <p className="text-[12px] text-text-primary font-medium mb-1 truncate">
        &ldquo;{finding.matchedText}&rdquo;
      </p>

      {/* Explanation */}
      <p className="text-[12px] text-text-secondary leading-5 mb-2">
        {finding.explanation}
      </p>

      {/* Suggested fix */}
      {finding.suggestedFix && finding.decision === "pending" && (
        <div className="mb-2 px-2.5 py-2 bg-surface-raised rounded border border-border-subtle">
          <p className="text-[11px] text-text-muted font-medium mb-0.5">Suggested correction:</p>
          <p className="text-[12px] text-text-primary font-medium">
            {finding.suggestedFix}
          </p>
          {finding.intentRationale && (
            <p className="text-[11px] text-text-muted mt-1 italic">
              {finding.intentRationale}
            </p>
          )}
        </div>
      )}

      {/* Dismissal reasons */}
      {isDismissing && (
        <div className="mb-2 px-2.5 py-2 bg-surface-raised rounded border border-border-subtle">
          <p className="text-[11px] text-text-muted font-medium mb-1.5">
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
                <span className="text-[12px] text-text-secondary">{r.label}</span>
              </label>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onConfirmDismiss(selectedReason);
              }}
              className="text-[11px] font-semibold px-2.5 py-1 rounded bg-stone-200 dark:bg-stone-700 text-text-primary hover:bg-stone-300 dark:hover:bg-stone-600 transition-base"
            >
              Confirm Dismiss
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCancelDismiss();
              }}
              className="text-[11px] font-medium px-2.5 py-1 text-text-muted hover:text-text-secondary transition-base"
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
              className="text-[11px] font-semibold px-2.5 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-base"
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
              className="text-[11px] font-medium px-2.5 py-1 rounded border border-border-subtle text-text-secondary hover:bg-surface-raised transition-base"
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
              className="text-[11px] font-medium px-2.5 py-1 rounded border border-border-subtle text-text-secondary hover:bg-surface-raised transition-base"
            >
              Undo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
