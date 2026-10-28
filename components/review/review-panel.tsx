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
  draft: { label: "Draft", color: "text-mute" },
  in_review: { label: "In Review", color: "text-[#f5a623]" },
  changes_requested: { label: "Changes Requested", color: "text-[#ee0000] dark:text-[#ff6666]" },
  approved: { label: "Approved", color: "text-[#0070f3] dark:text-[#3291ff]" },
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
    <div className="flex flex-col h-full bg-canvas">
      {/* Status header */}
      <div className="border-b border-hairline px-5 py-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-body-sm-strong text-ink">Review Workflow</h2>
          <span className={cn("text-caption-mono font-medium uppercase", statusInfo.color)}>
            {statusInfo.label}
          </span>
        </div>

        {/* Resolution summary */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center py-2 bg-canvas-soft-2 rounded-[6px] border border-hairline">
            <div className="text-[16px] font-semibold text-[#ee0000] dark:text-[#ff6666] tabular-nums font-mono">
              {pendingCount}
            </div>
            <div className="text-[10px] text-mute uppercase font-mono">Open</div>
          </div>
          <div className="text-center py-2 bg-canvas-soft-2 rounded-[6px] border border-hairline">
            <div className="text-[16px] font-semibold text-[#0070f3] dark:text-[#3291ff] tabular-nums font-mono">
              {acceptedCount}
            </div>
            <div className="text-[10px] text-mute uppercase font-mono">Fixed</div>
          </div>
          <div className="text-center py-2 bg-canvas-soft-2 rounded-[6px] border border-hairline">
            <div className="text-[16px] font-semibold text-mute tabular-nums font-mono">
              {dismissedCount}
            </div>
            <div className="text-[10px] text-mute uppercase font-mono">Dismissed</div>
          </div>
        </div>

        {/* Actions */}
        {role === "creator" && reviewStatus === "draft" && (
          <button
            onClick={onSubmitForReview}
            disabled={findings.length === 0}
            className="w-full btn-pill btn-pill-primary disabled:opacity-40"
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
              className="w-full text-caption px-3 py-2 bg-canvas-soft-2 border border-hairline rounded-[6px] resize-none text-ink placeholder:text-mute focus:outline-none focus:ring-1 focus:ring-link"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onRequestChanges(reviewNotes);
                  setReviewNotes("");
                }}
                className="flex-1 text-caption font-semibold px-3 py-2 rounded-[100px] border border-hairline text-[#ee0000] dark:text-[#ff6666] hover:bg-canvas-soft-2 transition-base"
              >
                Request Changes
              </button>
              <button
                onClick={onApproveVersion}
                disabled={pendingCount > 0}
                className="flex-1 text-caption font-semibold px-3 py-2 rounded-[100px] bg-accent text-on-primary hover:bg-accent-hover transition-base disabled:opacity-40"
              >
                Approve
              </button>
            </div>
            {pendingCount > 0 && (
              <p className="text-[11px] text-mute">
                {pendingCount} finding{pendingCount > 1 ? "s" : ""} still unresolved. Resolve all before approving.
              </p>
            )}
          </div>
        )}

        {reviewStatus === "approved" && (
          <div className="px-3 py-2 bg-[#f0fdf4] dark:bg-[rgba(5,150,105,0.08)] border border-[#bbf7d0] dark:border-[rgba(5,150,105,0.2)] rounded-[6px]">
            <p className="text-caption font-medium text-[#166534] dark:text-[#86efac]">
              ✓ Version approved and locked.
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
