/*
 * Nipuna — Core Domain Types
 * Defines the contracts for the brand governance engine, findings, documents, and review workflow.
 */

export type Severity = "high" | "medium" | "low";

export type FindingCategory =
  | "terminology"
  | "claim"
  | "tone"
  | "policy";

export type EvidenceStatus =
  | "rule_match"
  | "supported"
  | "conflict"
  | "not_verified"
  | "tone_heuristic";

export type UserDecision = "pending" | "accepted" | "dismissed";

export type DismissalReason =
  | "contextually_valid"
  | "exception_granted"
  | "false_positive"
  | "rule_outdated";

export type ReviewStatus =
  | "draft"
  | "in_review"
  | "changes_requested"
  | "approved";

/* ---------- Brand Kit ---------- */

export interface BrandRule {
  id: string;
  category: FindingCategory;
  name: string;
  description: string;
  pattern: string;
  prohibitedForms: string[];
  replacement?: string;
  severity: Severity;
  version: number;
  active: boolean;
  rationale: string;
}

export interface ApprovedFact {
  id: string;
  statement: string;
  value: string;
  entity: string;
  owner: string;
  sourceReference: string;
  validFrom: string;
  expiry?: string;
  status: "active" | "deprecated";
}

/* ---------- Findings ---------- */

export interface Finding {
  id: string;
  category: FindingCategory;
  matchedText: string;
  span: [number, number];
  severity: Severity;
  evidenceStatus: EvidenceStatus;
  ruleId?: string;
  sourceId?: string;
  nearestSourceId?: string;
  explanation: string;
  suggestedFix?: string;
  intentRationale?: string;
  confidence: number;
  decision: UserDecision;
  dismissalReason?: DismissalReason;
}

/* ---------- Documents & Versions ---------- */

export interface DocumentVersion {
  id: string;
  versionNumber: number;
  content: string;
  findings: Finding[];
  reviewStatus: ReviewStatus;
  approver?: string;
  reviewerNotes?: string;
  createdAt: string;
}

export interface ReviewComment {
  id: string;
  actor: string;
  role: "creator" | "reviewer";
  versionNumber: number;
  findingId?: string;
  text: string;
  createdAt: string;
}

export interface ReviewEvent {
  id: string;
  actor: string;
  action: string;
  versionNumber: number;
  timestamp: string;
  comment?: string;
}

export interface GovDocument {
  id: string;
  title: string;
  versions: DocumentVersion[];
  comments: ReviewComment[];
  events: ReviewEvent[];
  createdAt: string;
  updatedAt: string;
}

/* ---------- Brand Kit Aggregate ---------- */

export interface BrandKit {
  id: string;
  name: string;
  rules: BrandRule[];
  facts: ApprovedFact[];
}

/* ---------- Scan Result ---------- */

export interface ScanSummary {
  total: number;
  byCategory: Record<FindingCategory, number>;
  bySeverity: Record<Severity, number>;
  byEvidence: Partial<Record<EvidenceStatus, number>>;
  riskScore: number;
}

export interface ScanResult {
  findings: Finding[];
  summary: ScanSummary;
  scannedAt: string;
  durationMs: number;
}
