"use client";

import { useState, useEffect, useTransition } from "react";
import Navbar from "@/components/layout/navbar";
import DraftWorkspace from "@/components/editor/draft-workspace";
import FindingsPanel from "@/components/editor/findings-panel";
import DiffViewer from "@/components/editor/diff-viewer";
import ReviewPanel from "@/components/review/review-panel";
import BrandKitManager from "@/components/brandkit/brand-kit-manager";
import GuidelineHealthDashboard from "@/components/insights/guideline-health-dashboard";

import { scanDraft } from "@/lib/engine/orchestrator";
import type {
  BrandRule,
  ApprovedFact,
  Finding,
  ReviewComment,
  ReviewEvent,
  DismissalReason,
  ReviewStatus,
} from "@/lib/engine/types";
import { DEMO_DRAFTS } from "@/lib/storage/demo-data";
import {
  getStoredRules,
  saveStoredRules,
  getStoredFacts,
  saveStoredFacts,
  getStoredComments,
  saveStoredComments,
  getStoredEvents,
  saveStoredEvents,
  resetToBenchmark,
  syncToSupabaseIfConnected,
} from "@/lib/storage/data-service";
import { cn } from "@/lib/utils/cn";

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>("review");
  const [role, setRole] = useState<"creator" | "reviewer" | "admin">("creator");

  // Brand Kit State
  const [rules, setRules] = useState<BrandRule[]>([]);
  const [facts, setFacts] = useState<ApprovedFact[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Editor & Document State
  const [docTitle, setDocTitle] = useState("Product Launch Announcement — Q4");
  const [content, setContent] = useState(DEMO_DRAFTS[0].content);
  const [originalContent, setOriginalContent] = useState(DEMO_DRAFTS[0].content);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [activeFindingId, setActiveFindingId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanDurationMs, setScanDurationMs] = useState<number | undefined>(undefined);
  const [viewMode, setViewMode] = useState<"editor" | "diff">("editor");

  // Review & Collaboration State
  const [rightPanelTab, setRightPanelTab] = useState<"findings" | "review">("findings");
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>("draft");
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [events, setEvents] = useState<ReviewEvent[]>([]);

  // History tracking for Guideline Health Insights
  const [findingsHistory, setFindingsHistory] = useState<Finding[]>([]);

  // Undo history for applied fixes: map findingId -> original matched text
  const [acceptedFixMap, setAcceptedFixMap] = useState<Record<string, string>>({});

  // Initialize from storage on client mount
  useEffect(() => {
    const loadedRules = getStoredRules();
    const loadedFacts = getStoredFacts();
    const loadedComments = getStoredComments();
    const loadedEvents = getStoredEvents();

    setRules(loadedRules);
    setFacts(loadedFacts);
    setComments(loadedComments);
    setEvents(loadedEvents);
    setIsInitialized(true);

    // Run initial scan on first load
    const result = scanDraft(DEMO_DRAFTS[0].content, loadedRules, loadedFacts);
    setFindings(result.findings);
    setFindingsHistory(result.findings);
    setScanDurationMs(result.durationMs);
  }, []);

  /* ---------- Run Governance Check ---------- */
  function handleRunCheck() {
    setIsScanning(true);
    const start = performance.now();

    // Orchestrator runs deterministically in milliseconds
    const result = scanDraft(content, rules, facts);
    const duration = Math.round(performance.now() - start);

    setFindings(result.findings);
    setScanDurationMs(duration);
    setIsScanning(false);
    setViewMode("editor");

    // Accumulate into findings history for the Insights dashboard
    setFindingsHistory((prev) => [...prev, ...result.findings]);

    const newEvent: ReviewEvent = {
      id: `evt-${Date.now()}`,
      actor: role,
      action: `ran automated check (${result.findings.length} findings, risk score: ${result.summary.riskScore})`,
      versionNumber: 1,
      timestamp: new Date().toISOString(),
    };
    const updatedEvents = [newEvent, ...events];
    setEvents(updatedEvents);
    saveStoredEvents(updatedEvents);
    syncToSupabaseIfConnected({ event: newEvent });
  }

  /* ---------- Intent-Preserving Fix (1-Click Accept) ---------- */
  function handleAcceptFix(findingId: string) {
    const finding = findings.find((f) => f.id === findingId);
    if (!finding || !finding.suggestedFix) return;

    const [start, end] = finding.span;
    const currentSlice = content.slice(start, end);

    // Save for undo
    setAcceptedFixMap((prev) => ({
      ...prev,
      [findingId]: currentSlice,
    }));

    // Replace text at precise span
    const before = content.slice(0, start);
    const after = content.slice(end);
    const newContent = before + finding.suggestedFix + after;
    const delta = finding.suggestedFix.length - currentSlice.length;

    setContent(newContent);

    // Mark finding as accepted and re-calculate spans for subsequent findings
    const updatedFindings = findings.map((f) => {
      if (f.id === findingId) {
        return { ...f, decision: "accepted" as const };
      }
      if (f.span[0] >= end) {
        return {
          ...f,
          span: [f.span[0] + delta, f.span[1] + delta] as [number, number],
        };
      }
      return f;
    });

    setFindings(updatedFindings);
    setFindingsHistory((prev) =>
      prev.map((f) => (f.id === findingId ? { ...f, decision: "accepted" } : f))
    );

    // Record audit event
    const newEvent: ReviewEvent = {
      id: `evt-${Date.now()}`,
      actor: role,
      action: `accepted suggested fix for "${finding.matchedText}" -> "${finding.suggestedFix}"`,
      versionNumber: 1,
      timestamp: new Date().toISOString(),
    };
    const updatedEvents = [newEvent, ...events];
    setEvents(updatedEvents);
    saveStoredEvents(updatedEvents);
  }

  /* ---------- Undo Accepted Fix ---------- */
  function handleUndoAccept(findingId: string) {
    const finding = findings.find((f) => f.id === findingId);
    const originalText = acceptedFixMap[findingId];
    if (!finding || !finding.suggestedFix || !originalText) return;

    const [start] = finding.span;
    const fixLength = finding.suggestedFix.length;

    const before = content.slice(0, start);
    const after = content.slice(start + fixLength);
    const restoredContent = before + originalText + after;
    const delta = originalText.length - fixLength;

    setContent(restoredContent);

    const updatedFindings = findings.map((f) => {
      if (f.id === findingId) {
        return { ...f, decision: "pending" as const };
      }
      if (f.span[0] >= start + fixLength) {
        return {
          ...f,
          span: [f.span[0] + delta, f.span[1] + delta] as [number, number],
        };
      }
      return f;
    });

    setFindings(updatedFindings);

    const { [findingId]: _removed, ...rest } = acceptedFixMap;
    setAcceptedFixMap(rest);
  }

  /* ---------- Dismiss Finding with Rationale ---------- */
  function handleDismiss(findingId: string, reason: DismissalReason) {
    const finding = findings.find((f) => f.id === findingId);
    const updatedFindings = findings.map((f) =>
      f.id === findingId
        ? { ...f, decision: "dismissed" as const, dismissalReason: reason }
        : f
    );
    setFindings(updatedFindings);

    // Update history for health dashboard
    setFindingsHistory((prev) =>
      prev.map((f) =>
        f.id === findingId
          ? { ...f, decision: "dismissed", dismissalReason: reason }
          : f
      )
    );

    // Record audit event
    const newEvent: ReviewEvent = {
      id: `evt-${Date.now()}`,
      actor: role,
      action: `dismissed finding "${finding?.matchedText || findingId}"`,
      comment: `Reason: ${reason.replace(/_/g, " ")}`,
      versionNumber: 1,
      timestamp: new Date().toISOString(),
    };
    const updatedEvents = [newEvent, ...events];
    setEvents(updatedEvents);
    saveStoredEvents(updatedEvents);
    syncToSupabaseIfConnected({ event: newEvent });
  }

  /* ---------- Load Benchmark Test Draft ---------- */
  function handleLoadDraft(index: number) {
    const draft = DEMO_DRAFTS[index];
    if (!draft) return;
    setDocTitle(draft.title);
    setContent(draft.content);
    setOriginalContent(draft.content);
    setReviewStatus("draft");
    setViewMode("editor");
    setAcceptedFixMap({});

    // Scan the newly loaded draft
    const result = scanDraft(draft.content, rules, facts);
    setFindings(result.findings);
    setFindingsHistory((prev) => [...prev, ...result.findings]);
    setScanDurationMs(result.durationMs);
  }

  /* ---------- Handle DOCX / TXT Upload ---------- */
  function handleDocxUpload(text: string) {
    setContent(text);
    setOriginalContent(text);
    setReviewStatus("draft");
    setViewMode("editor");
    setAcceptedFixMap({});

    const result = scanDraft(text, rules, facts);
    setFindings(result.findings);
    setFindingsHistory((prev) => [...prev, ...result.findings]);
    setScanDurationMs(result.durationMs);

    const newEvent: ReviewEvent = {
      id: `evt-${Date.now()}`,
      actor: role,
      action: `uploaded new document (${text.split(/\s+/).length} words)`,
      versionNumber: 1,
      timestamp: new Date().toISOString(),
    };
    const updatedEvents = [newEvent, ...events];
    setEvents(updatedEvents);
    saveStoredEvents(updatedEvents);
  }

  /* ---------- Workflow Handlers ---------- */
  function handleSubmitForReview() {
    setReviewStatus("in_review");
    const newEvent: ReviewEvent = {
      id: `evt-${Date.now()}`,
      actor: role,
      action: "submitted draft version 1 for review",
      versionNumber: 1,
      timestamp: new Date().toISOString(),
    };
    const updatedEvents = [newEvent, ...events];
    setEvents(updatedEvents);
    saveStoredEvents(updatedEvents);
    syncToSupabaseIfConnected({ event: newEvent });
    setRightPanelTab("review");
  }

  function handleRequestChanges(notes: string) {
    setReviewStatus("changes_requested");
    const newEvent: ReviewEvent = {
      id: `evt-${Date.now()}`,
      actor: role,
      action: "requested changes on version 1",
      comment: notes || undefined,
      versionNumber: 1,
      timestamp: new Date().toISOString(),
    };
    const updatedEvents = [newEvent, ...events];
    setEvents(updatedEvents);
    saveStoredEvents(updatedEvents);
    syncToSupabaseIfConnected({ event: newEvent });
  }

  function handleApproveVersion() {
    setReviewStatus("approved");
    const newEvent: ReviewEvent = {
      id: `evt-${Date.now()}`,
      actor: role,
      action: "approved and locked version 1",
      versionNumber: 1,
      timestamp: new Date().toISOString(),
    };
    const updatedEvents = [newEvent, ...events];
    setEvents(updatedEvents);
    saveStoredEvents(updatedEvents);
    syncToSupabaseIfConnected({ event: newEvent });
  }

  function handleAddComment(text: string) {
    const newComment: ReviewComment = {
      id: `com-${Date.now()}`,
      actor: role,
      role: role === "reviewer" ? "reviewer" : "creator",
      versionNumber: 1,
      text,
      createdAt: new Date().toISOString(),
    };
    const updatedComments = [...comments, newComment];
    setComments(updatedComments);
    saveStoredComments(updatedComments);
    syncToSupabaseIfConnected({ comment: newComment });
  }

  /* ---------- Brand Kit Mutations ---------- */
  function handleAddRule(newRule: BrandRule) {
    const updated = [newRule, ...rules];
    setRules(updated);
    saveStoredRules(updated);
  }

  function handleUpdateRule(updatedRule: BrandRule) {
    const updated = rules.map((r) => (r.id === updatedRule.id ? updatedRule : r));
    setRules(updated);
    saveStoredRules(updated);
  }

  function handleDeleteRule(ruleId: string) {
    const updated = rules.filter((r) => r.id !== ruleId);
    setRules(updated);
    saveStoredRules(updated);
  }

  function handleAddFact(newFact: ApprovedFact) {
    const updated = [newFact, ...facts];
    setFacts(updated);
    saveStoredFacts(updated);
  }

  function handleUpdateFact(updatedFact: ApprovedFact) {
    const updated = facts.map((f) => (f.id === updatedFact.id ? updatedFact : f));
    setFacts(updated);
    saveStoredFacts(updated);
  }

  function handleDeleteFact(factId: string) {
    const updated = facts.filter((f) => f.id !== factId);
    setFacts(updated);
    saveStoredFacts(updated);
  }

  function handleResetToDemo() {
    const reset = resetToBenchmark();
    setRules(reset.rules);
    setFacts(reset.facts);
    setComments([]);
    setEvents([]);
    handleLoadDraft(0);
  }

  const isLocked = reviewStatus === "approved";
  const unresolvedCount = findings.filter(
    (f) => f.decision === "pending" && f.evidenceStatus !== "supported"
  ).length;

  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-text-muted text-[13px]">
        Loading Nipuna Brand Governance Workspace…
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Top Navigation */}
      <Navbar
        brandName="Inkloom Corp"
        activeTab={activeTab}
        onTabChange={setActiveTab}
        role={role}
        onRoleChange={setRole}
      />

      {/* Main Workspace Body */}
      {activeTab === "review" && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Subheader / Document Status Toolbar */}
          <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2 bg-surface text-[12px]">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                disabled={isLocked}
                className="font-semibold text-[13px] text-text-primary bg-transparent focus:outline-none focus:ring-1 focus:ring-accent rounded px-1 -ml-1 w-64 sm:w-80 truncate"
              />
              <span className="text-text-muted">·</span>
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-surface-raised text-text-secondary border border-border-subtle">
                v1.0 {isLocked ? "(Locked)" : "(Editable)"}
              </span>

              {/* View toggle */}
              <div className="hidden sm:flex items-center bg-surface-raised rounded p-0.5 border border-border-subtle text-[11px]">
                <button
                  onClick={() => setViewMode("editor")}
                  className={cn(
                    "px-2.5 py-1 rounded font-medium transition-base",
                    viewMode === "editor"
                      ? "bg-surface shadow-xs text-text-primary font-semibold"
                      : "text-text-secondary hover:text-text-primary"
                  )}
                >
                  Editor View
                </button>
                <button
                  onClick={() => setViewMode("diff")}
                  className={cn(
                    "px-2.5 py-1 rounded font-medium transition-base",
                    viewMode === "diff"
                      ? "bg-surface shadow-xs text-text-primary font-semibold"
                      : "text-text-secondary hover:text-text-primary"
                  )}
                >
                  Diff Comparison
                </button>
              </div>
            </div>

            {/* Right side drawer tab switch */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRightPanelTab("findings")}
                className={cn(
                  "px-2.5 py-1 text-[12px] font-medium rounded-md transition-base",
                  rightPanelTab === "findings"
                    ? "bg-surface-raised text-text-primary font-semibold border border-border-subtle"
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                Findings ({findings.length})
                {unresolvedCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-bold">
                    {unresolvedCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setRightPanelTab("review")}
                className={cn(
                  "px-2.5 py-1 text-[12px] font-medium rounded-md transition-base",
                  rightPanelTab === "review"
                    ? "bg-surface-raised text-text-primary font-semibold border border-border-subtle"
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                Workflow & Review
                {comments.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-surface-raised text-text-secondary font-mono">
                    {comments.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Split Screen Workbench */}
          <div className="flex flex-1 overflow-hidden">
            {/* Center Area: Editor or Diff View */}
            <div className="flex-1 flex flex-col overflow-hidden bg-background">
              {viewMode === "editor" ? (
                <DraftWorkspace
                  content={content}
                  onContentChange={setContent}
                  findings={findings}
                  activeFindingId={activeFindingId}
                  onFindingClick={(id) => {
                    setActiveFindingId(id);
                    setRightPanelTab("findings");
                  }}
                  onRunCheck={handleRunCheck}
                  onLoadDraft={handleLoadDraft}
                  onDocxUpload={handleDocxUpload}
                  draftOptions={DEMO_DRAFTS.map((d) => ({
                    title: d.title,
                    description: d.description,
                  }))}
                  isScanning={isScanning}
                  scanDurationMs={scanDurationMs}
                  isLocked={isLocked}
                />
              ) : (
                <DiffViewer
                  originalText={originalContent}
                  revisedText={content}
                />
              )}
            </div>

            {/* Right Side Drawer */}
            <div className="w-[380px] lg:w-[420px] xl:w-[460px] h-full flex flex-col shrink-0 border-l border-border-subtle bg-surface">
              {rightPanelTab === "findings" ? (
                <FindingsPanel
                  findings={findings}
                  activeFindingId={activeFindingId}
                  onFindingSelect={setActiveFindingId}
                  onAcceptFix={handleAcceptFix}
                  onDismiss={handleDismiss}
                  onUndoAccept={handleUndoAccept}
                  role={role}
                  isLocked={isLocked}
                />
              ) : (
                <ReviewPanel
                  findings={findings}
                  comments={comments}
                  events={events}
                  reviewStatus={reviewStatus}
                  role={role}
                  onSubmitForReview={handleSubmitForReview}
                  onRequestChanges={handleRequestChanges}
                  onApproveVersion={handleApproveVersion}
                  onAddComment={handleAddComment}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Brand Kit Tab */}
      {activeTab === "brandkit" && (
        <BrandKitManager
          rules={rules}
          facts={facts}
          onAddRule={handleAddRule}
          onUpdateRule={handleUpdateRule}
          onDeleteRule={handleDeleteRule}
          onAddFact={handleAddFact}
          onUpdateFact={handleUpdateFact}
          onDeleteFact={handleDeleteFact}
          onResetToDemo={handleResetToDemo}
          role={role}
        />
      )}

      {/* Guideline Health Insights Tab */}
      {activeTab === "insights" && (
        <GuidelineHealthDashboard
          rules={rules}
          findingsHistory={findingsHistory}
          events={events}
          onNavigateToRule={() => setActiveTab("brandkit")}
        />
      )}
    </div>
  );
}
