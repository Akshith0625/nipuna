"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { Finding, ReviewComment, ReviewEvent } from "@/lib/engine/types";

interface ReviewPanelProps {
  findings: Finding[];
  comments: ReviewComment[];
  events: ReviewEvent[];
  reviewStatus: "draft" | "in_review" | "changes_requested" | "approved";
  role: "creator" | "reviewer" | "admin";
  onSubmitForReview: () => void;
  onRequestChanges: (notes: string) => void;
  onApproveVersion: () => void;
  onAddComment: (text: string) => void;
}

const STATUS_BADGES: Record<string, { label: string; badgeClass: string; icon: string }> = {
  draft: { label: "Draft Workspace", badgeClass: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700", icon: "✏️" },
  in_review: { label: "Under Active Review", badgeClass: "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800", icon: "👀" },
  changes_requested: { label: "Changes Requested", badgeClass: "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800", icon: "⚠️" },
  approved: { label: "Approved & Locked", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800", icon: "✓" },
};

export default function ReviewPanel({
  findings,
  comments,
  events,
  reviewStatus,
  role,
  onSubmitForReview,
  onRequestChanges,
  onApproveVersion,
  onAddComment,
}: ReviewPanelProps) {
  const [reviewNotes, setReviewNotes] = useState("");
  const [commentText, setCommentText] = useState("");

  const pendingCount = findings.filter((f) => f.decision === "pending" && f.evidenceStatus !== "supported").length;
  const acceptedCount = findings.filter((f) => f.decision === "accepted").length;
  const dismissedCount = findings.filter((f) => f.decision === "dismissed").length;

  const currentStatus = STATUS_BADGES[reviewStatus] || STATUS_BADGES.draft;

  function handleAddComment() {
    if (!commentText.trim()) return;
    onAddComment(commentText.trim());
    setCommentText("");
  }

  return (
    <div className="flex flex-col h-full bg-canvas text-ink">
      {/* Status header */}
      <div className="border-b border-hairline/80 px-5 py-4 bg-canvas-soft/40 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h2 className="text-body-sm-strong text-ink tracking-tight">Review Workflow</h2>
            <p className="text-[11px] text-mute">Track governance checks and sign-off</p>
          </div>
          <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border shadow-xs", currentStatus.badgeClass)}>
            <span>{currentStatus.icon}</span>
            <span>{currentStatus.label}</span>
          </span>
        </div>

        {/* Resolution summary cards */}
        <div className="grid grid-cols-3 gap-2.5 mb-3.5">
          <div className="text-center py-2.5 px-2 bg-canvas rounded-lg border border-rose-200/60 dark:border-rose-900/40 shadow-xs hover:shadow-card transition-all">
            <div className="text-[18px] font-bold text-rose-600 dark:text-rose-400 tabular-nums font-mono leading-none mb-1">
              {pendingCount}
            </div>
            <div className="text-[10px] text-rose-700 dark:text-rose-400/80 uppercase font-semibold tracking-wider font-mono">Open</div>
          </div>
          <div className="text-center py-2.5 px-2 bg-canvas rounded-lg border border-emerald-200/60 dark:border-emerald-900/40 shadow-xs hover:shadow-card transition-all">
            <div className="text-[18px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums font-mono leading-none mb-1">
              {acceptedCount}
            </div>
            <div className="text-[10px] text-emerald-700 dark:text-emerald-400/80 uppercase font-semibold tracking-wider font-mono">Fixed</div>
          </div>
          <div className="text-center py-2.5 px-2 bg-canvas rounded-lg border border-hairline shadow-xs hover:shadow-card transition-all">
            <div className="text-[18px] font-bold text-mute tabular-nums font-mono leading-none mb-1">
              {dismissedCount}
            </div>
            <div className="text-[10px] text-mute uppercase font-semibold tracking-wider font-mono">Dismissed</div>
          </div>
        </div>

        {/* Actions */}
        {role === "creator" && reviewStatus === "draft" && (
          <button
            onClick={onSubmitForReview}
            disabled={findings.length === 0}
            className="w-full btn-pill btn-pill-primary shadow-sm hover:shadow-md transition-all font-semibold flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Submit for Review
          </button>
        )}

        {role === "reviewer" && (reviewStatus === "in_review" || reviewStatus === "changes_requested") && (
          <div className="flex flex-col gap-2.5 bg-canvas p-3 rounded-lg border border-hairline shadow-xs">
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Reviewer notes or guidance for creator…"
              rows={2}
              className="w-full text-caption px-3 py-2 bg-canvas-soft border border-hairline rounded-md resize-none text-ink placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onRequestChanges(reviewNotes);
                  setReviewNotes("");
                }}
                className="flex-1 text-caption font-semibold px-3 py-2 rounded-full border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all shadow-xs"
              >
                Request Changes
              </button>
              <button
                onClick={onApproveVersion}
                disabled={pendingCount > 0}
                className="flex-1 text-caption font-semibold px-3 py-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-xs disabled:opacity-40 flex items-center justify-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Approve
              </button>
            </div>
            {pendingCount > 0 && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <span>ℹ️</span> {pendingCount} unresolved finding{pendingCount > 1 ? "s" : ""}. Resolve before approving.
              </p>
            )}
          </div>
        )}

        {reviewStatus === "approved" && (
          <div className="px-3.5 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg shadow-xs flex items-center gap-2">
            <span className="text-emerald-600 text-sm">✓</span>
            <p className="text-caption font-semibold text-emerald-800 dark:text-emerald-300">
              Version approved and locked for publication.
            </p>
          </div>
        )}
      </div>

      {/* Comments section */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-3 border-b border-hairline">
          <h3 className="text-caption font-semibold text-ink mb-2">Collaboration Notes</h3>
          <div className="flex items-start gap-2">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={`Add a comment as ${role}…`}
              rows={2}
              className="flex-1 text-caption px-3 py-2 bg-canvas-soft-2 border border-hairline rounded-[6px] resize-none text-ink placeholder:text-mute focus:outline-none focus:ring-1 focus:ring-link"
            />
            <button
              onClick={handleAddComment}
              disabled={!commentText.trim()}
              className="btn-pill btn-pill-primary text-caption !h-auto py-2 px-3 disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </div>

        {/* Comment list */}
        <div className="divide-y divide-hairline">
          {comments.length === 0 && events.length === 0 && (
            <div className="px-5 py-8 text-center text-caption text-mute">
              No activity recorded yet
            </div>
          )}

          {/* Interleave comments and events, sorted by time */}
          {[
            ...comments.map((c) => ({ type: "comment" as const, data: c, time: c.createdAt })),
            ...events.map((e) => ({ type: "event" as const, data: e, time: e.timestamp })),
          ]
            .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
            .map((item, i) => {
              if (item.type === "comment") {
                const c = item.data as ReviewComment;
                return (
                  <div key={`c-${i}`} className="px-5 py-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-caption font-semibold text-ink capitalize">
                        {c.actor}
                      </span>
                      <span className="text-[10px] text-mute uppercase font-mono px-1.5 py-0.2 rounded bg-canvas-soft-2 border border-hairline">
                        {c.role}
                      </span>
                      <span className="text-caption-mono text-mute ml-auto">
                        {formatTime(c.createdAt)}
                      </span>
                    </div>
                    <p className="text-caption text-body leading-5">{c.text}</p>
                  </div>
                );
              } else {
                const e = item.data as ReviewEvent;
                return (
                  <div key={`e-${i}`} className="px-5 py-2 bg-canvas-soft-2">
                    <p className="text-caption text-mute">
                      <span className="font-medium text-body">{e.actor}</span>
                      {" "}{e.action}
                      {e.comment && <span className="italic"> — &ldquo;{e.comment}&rdquo;</span>}
                      <span className="ml-2 text-caption-mono text-mute">{formatTime(e.timestamp)}</span>
                    </p>
                  </div>
                );
              }
            })}
        </div>
      </div>
    </div>
  );
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}
