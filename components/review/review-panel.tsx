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

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "text-text-muted" },
  in_review: { label: "In Review", color: "text-amber-600 dark:text-amber-400" },
  changes_requested: { label: "Changes Requested", color: "text-rose-600 dark:text-rose-400" },
  approved: { label: "Approved", color: "text-emerald-600 dark:text-emerald-400" },
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

  const statusInfo = STATUS_LABELS[reviewStatus];

  function handleAddComment() {
    if (!commentText.trim()) return;
    onAddComment(commentText.trim());
    setCommentText("");
  }

  return (
    <div className="flex flex-col h-full border-l border-border-subtle bg-surface">
      {/* Status header */}
      <div className="border-b border-border-subtle px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-semibold text-text-primary">Review</h2>
          <span className={cn("text-[12px] font-semibold", statusInfo.color)}>
            {statusInfo.label}
          </span>
        </div>

        {/* Resolution summary */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center py-2 bg-surface-raised rounded border border-border-subtle">
            <div className="text-[16px] font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
              {pendingCount}
            </div>
            <div className="text-[10px] text-text-muted uppercase font-medium">Open</div>
          </div>
          <div className="text-center py-2 bg-surface-raised rounded border border-border-subtle">
            <div className="text-[16px] font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {acceptedCount}
            </div>
            <div className="text-[10px] text-text-muted uppercase font-medium">Fixed</div>
          </div>
          <div className="text-center py-2 bg-surface-raised rounded border border-border-subtle">
            <div className="text-[16px] font-semibold text-stone-500 tabular-nums">
              {dismissedCount}
            </div>
            <div className="text-[10px] text-text-muted uppercase font-medium">Dismissed</div>
          </div>
        </div>

        {/* Actions */}
        {role === "creator" && reviewStatus === "draft" && (
          <button
            onClick={onSubmitForReview}
            disabled={findings.length === 0}
            className="w-full text-[12px] font-semibold px-3 py-2 rounded-md bg-accent text-white dark:text-background hover:bg-accent-hover transition-base disabled:opacity-40"
          >
            Submit for Review
          </button>
        )}

        {role === "reviewer" && (reviewStatus === "in_review" || reviewStatus === "changes_requested") && (
          <div className="flex flex-col gap-2">
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Reviewer notes (optional)…"
              rows={2}
              className="w-full text-[12px] px-2.5 py-2 bg-surface-raised border border-border-subtle rounded-md resize-none text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onRequestChanges(reviewNotes);
                  setReviewNotes("");
                }}
                className="flex-1 text-[12px] font-semibold px-3 py-2 rounded-md border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-base"
              >
                Request Changes
              </button>
              <button
                onClick={onApproveVersion}
                disabled={pendingCount > 0}
                className="flex-1 text-[12px] font-semibold px-3 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-base disabled:opacity-40"
              >
                Approve
              </button>
            </div>
            {pendingCount > 0 && (
              <p className="text-[11px] text-text-muted">
                {pendingCount} finding{pendingCount > 1 ? "s" : ""} still unresolved. Resolve all before approving.
              </p>
            )}
          </div>
        )}

        {reviewStatus === "approved" && (
          <div className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-md">
            <p className="text-[12px] text-emerald-800 dark:text-emerald-300 font-medium">
              ✓ Version approved and locked.
            </p>
          </div>
        )}
      </div>

      {/* Comments section */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-3 border-b border-border-subtle">
          <h3 className="text-[12px] font-semibold text-text-primary mb-2">Comments</h3>
          <div className="flex items-start gap-2">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={`Add a comment as ${role}…`}
              rows={2}
              className="flex-1 text-[12px] px-2.5 py-2 bg-surface-raised border border-border-subtle rounded-md resize-none text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <button
              onClick={handleAddComment}
              disabled={!commentText.trim()}
              className="text-[11px] font-semibold px-2.5 py-2 rounded-md bg-accent text-white dark:text-background hover:bg-accent-hover transition-base disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </div>

        {/* Comment list */}
        <div className="divide-y divide-border-subtle">
          {comments.length === 0 && events.length === 0 && (
            <div className="px-4 py-8 text-center text-[12px] text-text-muted">
              No activity yet
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
                  <div key={`c-${i}`} className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[11px] font-semibold text-text-primary capitalize">
                        {c.actor}
                      </span>
                      <span className="text-[10px] text-text-muted font-medium uppercase">
                        {c.role}
                      </span>
                      <span className="text-[10px] text-text-muted ml-auto">
                        {formatTime(c.createdAt)}
                      </span>
                    </div>
                    <p className="text-[12px] text-text-secondary leading-5">{c.text}</p>
                  </div>
                );
              } else {
                const e = item.data as ReviewEvent;
                return (
                  <div key={`e-${i}`} className="px-4 py-2 bg-surface-raised/50">
                    <p className="text-[11px] text-text-muted">
                      <span className="font-medium text-text-secondary">{e.actor}</span>
                      {" "}{e.action}
                      {e.comment && <span className="italic"> — &ldquo;{e.comment}&rdquo;</span>}
                      <span className="ml-1.5 text-[10px]">{formatTime(e.timestamp)}</span>
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
