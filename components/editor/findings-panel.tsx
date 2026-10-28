"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Check, Zap, CheckCircle2, X } from "lucide-react";
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

const CATEGORY_LABELS: Record<FindingCategory, { label: string }> = {
  terminology: { label: "Terminology" },
  claim: { label: "Claims" },
  tone: { label: "Tone & Voice" },
  policy: { label: "Policy" },
};

const EVIDENCE_LABELS: Record<EvidenceStatus, string> = {
  rule_match: "Rule Match",
  conflict: "Fact Conflict",
  not_verified: "Unbacked Claim",
  supported: "Verified",
  tone_heuristic: "Tone Heuristic",
};

const SEVERITY_BADGES: Record<string, string> = {
  high: "bg-rose-100 text-rose-800 border-rose-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-blue-100 text-blue-800 border-blue-200",
};

const EVIDENCE_COLORS: Record<EvidenceStatus, { text: string; bg: string }> = {
  conflict: { text: "text-rose-700", bg: "bg-rose-50" },
  not_verified: { text: "text-amber-700", bg: "bg-amber-50" },
  rule_match: { text: "text-indigo-700", bg: "bg-indigo-50" },
  supported: { text: "text-emerald-700", bg: "bg-emerald-50" },
  tone_heuristic: { text: "text-purple-700", bg: "bg-purple-50" },
};

const DISMISSAL_REASONS: { value: DismissalReason; label: string }[] = [
  { value: "contextually_valid", label: "Contextually valid for audience" },
  { value: "exception_granted", label: "Brand exception granted" },
  { value: "false_positive", label: "False positive detection" },
  { value: "rule_outdated", label: "Rule policy is outdated" },
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
  const [evidenceFilter, setEvidenceFilter] = useState<EvidenceFilter>("all");
  const [dismissingId, setDismissingId] = useState<string | null>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll finding card into view when activeFindingId changes
  useEffect(() => {
    if (!activeFindingId || !listContainerRef.current) return;
    const cardEl = document.getElementById(`finding-card-${activeFindingId}`);
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeFindingId]);

  // Filter findings
  const filtered = findings.filter((f) => {
    if (categoryFilter !== "all" && f.category !== categoryFilter) return false;
    if (evidenceFilter === "actionable") {
      return f.evidenceStatus !== "supported" && f.suggestedFix !== undefined;
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
    <div className="flex flex-col h-full bg-slate-50/70 border-l border-slate-200/80">
      {/* Header */}
      <div className="border-b border-slate-200/80 px-4 py-3 bg-white shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">
              Findings
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
              {filtered.length} shown
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono tabular-nums">
            <span className="text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              {actionableCount} open
            </span>
            <span className="text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {resolvedCount} resolved
            </span>
          </div>
        </div>

        {/* Tier 1: Category Filters ([All] | [Terminology] | [Claims] | [Tone & Voice] | [Policy]) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {(["all", "terminology", "claim", "tone", "policy"] as CategoryFilter[]).map((cat) => {
            const isSelected = categoryFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium rounded-lg transition-all shrink-0",
                  isSelected
                    ? "bg-indigo-600 text-white shadow-xs font-semibold"
                    : "text-slate-600 bg-slate-100 hover:bg-slate-200/70"
                )}
              >
                {cat === "all" ? "All" : CATEGORY_LABELS[cat].label}
              </button>
            );
          })}
        </div>

        {/* Tier 2: Evidence Status Filters ([All Statuses] strictly BEFORE [Actionable] | [Fact Conflict] | [Unbacked Claim] | [Rule Match]) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1.5 pb-0.5">
          {(["all", "actionable", "conflict", "not_verified", "rule_match"] as EvidenceFilter[]).map((ev) => {
            const isSelected = evidenceFilter === ev;
            return (
              <button
                key={ev}
                onClick={() => setEvidenceFilter(ev)}
                className={cn(
                  "px-2.5 py-1 text-[11px] font-medium rounded-md transition-all shrink-0 inline-flex items-center gap-1",
                  isSelected
                    ? "bg-slate-800 text-white font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/60"
                )}
              >
                {ev === "actionable" && <Zap className={cn("w-3 h-3", isSelected ? "text-amber-400" : "text-amber-500")} strokeWidth={2} />}
                <span>
                  {ev === "all"
                    ? "All Statuses"
                    : ev === "actionable"
                    ? "Actionable"
                    : EVIDENCE_LABELS[ev as EvidenceStatus]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Finding list */}
      <div ref={listContainerRef} className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-6 bg-white rounded-xl border border-dashed border-slate-300">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" strokeWidth={1.75} />
            <p className="text-xs font-semibold text-slate-700">
              {findings.length === 0
                ? "Click 'Run Governance Review' to scan your draft"
                : "No findings match the current filter"}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
              Every assertion is verified against approved facts and brand guidelines.
            </p>
          </div>
        ) : (
          filtered.map((finding) => (
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
          ))
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
      id={`finding-card-${finding.id}`}
      onClick={onSelect}
      className={cn(
        "p-3.5 rounded-xl border transition-all duration-200 cursor-pointer shadow-xs",
        isActive
          ? "bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/25 shadow-md"
          : "bg-white hover:bg-slate-50/80 border-slate-200/90",
        isResolved && "opacity-60 bg-slate-50"
      )}
    >
      {/* Top row — severity badge + evidence status + rule ID */}
      <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
        <span
          className={cn(
            "px-2 py-0.5 text-[10px] font-bold uppercase rounded border",
            SEVERITY_BADGES[finding.severity]
          )}
        >
          {finding.severity}
        </span>

        <span
          className={cn(
            "text-[11px] font-semibold px-2 py-0.5 rounded border border-slate-200/60",
            EVIDENCE_COLORS[finding.evidenceStatus]?.bg,
            EVIDENCE_COLORS[finding.evidenceStatus]?.text
          )}
        >
          {EVIDENCE_LABELS[finding.evidenceStatus]}
        </span>

        {finding.ruleId && (
          <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
            {finding.ruleId}
          </span>
        )}
        {finding.sourceId && (
          <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
            {finding.sourceId}
          </span>
        )}

        {isResolved && (
          <span
            className={cn(
              "text-[10.5px] font-bold uppercase ml-auto px-2 py-0.5 rounded inline-flex items-center gap-1",
              finding.decision === "accepted"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-slate-200 text-slate-700"
            )}
          >
            {finding.decision === "accepted" ? (
              <>
                <Check className="w-3 h-3 text-emerald-700" strokeWidth={2.5} />
                <span>Fix Applied</span>
              </>
            ) : (
              <>
                <X className="w-3 h-3 text-slate-600" strokeWidth={2.5} />
                <span>Dismissed</span>
              </>
            )}
          </span>
        )}
      </div>

      {/* Matched text with tight quote formatting */}
      <div className="mb-1 leading-snug">
        <span className="bg-amber-100/90 text-amber-950 font-semibold px-1.5 py-0.5 rounded text-xs border border-amber-200/70 inline-block">
          &ldquo;{finding.matchedText.trim()}&rdquo;
        </span>
      </div>

      {/* Explanation */}
      <p className="text-xs text-slate-600 leading-relaxed mb-2.5">
        {finding.explanation}
      </p>

      {/* Suggested fix */}
      {finding.suggestedFix && finding.decision === "pending" && (
        <div className="mb-2.5 p-2.5 bg-emerald-50/70 rounded-lg border border-emerald-200/80">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 mb-0.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" strokeWidth={1.75} />
            <span>Suggested Correction:</span>
          </div>
          <p className="text-xs font-semibold text-emerald-950 font-mono">
            {finding.suggestedFix}
          </p>
          {finding.intentRationale && (
            <p className="text-[11px] text-emerald-700 mt-1 italic leading-tight">
              Reason: {finding.intentRationale}
            </p>
          )}
        </div>
      )}

      {/* Dismissal options dialog */}
      {isDismissing && (
        <div className="mb-2.5 p-3 bg-slate-100 rounded-lg border border-slate-300 space-y-2">
          <p className="text-xs font-bold text-slate-800">
            Select rationale for dismissing this finding:
          </p>
          <div className="space-y-1">
            {DISMISSAL_REASONS.map((r) => (
              <label key={r.value} className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                <input
                  type="radio"
                  name={`dismiss-${finding.id}`}
                  checked={selectedReason === r.value}
                  onChange={() => setSelectedReason(r.value)}
                  className="accent-indigo-600"
                />
                <span>{r.label}</span>
              </label>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onConfirmDismiss(selectedReason);
              }}
              className="px-3 py-1 text-xs font-bold rounded-lg bg-slate-800 text-white hover:bg-slate-900 transition-colors shadow-xs"
            >
              Confirm Dismissal
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCancelDismiss();
              }}
              className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Action buttons (rounded-lg matching card system) */}
      {!isLocked && !isDismissing && (
        <div className="flex items-center gap-2 pt-1">
          {finding.decision === "pending" && finding.suggestedFix && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAccept();
              }}
              className="rounded-lg inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 h-8 bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-colors"
            >
              <Check className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
              <span>Accept Fix</span>
            </button>
          )}
          {finding.decision === "pending" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartDismiss();
              }}
              className="rounded-lg inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 h-8 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <span>Dismiss…</span>
            </button>
          )}
          {finding.decision === "accepted" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUndo();
              }}
              className="rounded-lg inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 h-8 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <span>Undo Fix</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
