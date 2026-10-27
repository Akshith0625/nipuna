/*
 * Nipuna — Check Orchestrator
 * Combines rule matching and fact verification into a single parallel check pipeline.
 * Returns comprehensive finding list with summary metrics.
 */

import type {
  BrandRule,
  ApprovedFact,
  Finding,
  FindingCategory,
  Severity,
  EvidenceStatus,
  ScanResult,
  ScanSummary,
} from "./types";
import { matchRules, resetFindingCounter } from "./rules";
import { verifyFacts, resetFactFindingCounter } from "./facts";

/**
 * Deduplicate findings that overlap the same text span.
 * Prefers higher severity, then rule_match > conflict > not_verified > supported.
 */
function deduplicateFindings(findings: Finding[]): Finding[] {
  // Sort by span start, then by severity weight descending
  const severityWeight: Record<Severity, number> = { high: 3, medium: 2, low: 1 };
  const evidenceWeight: Record<string, number> = {
    conflict: 5,
    rule_match: 4,
    not_verified: 3,
    tone_heuristic: 2,
    supported: 1,
  };

  const sorted = [...findings].sort((a, b) => {
    if (a.span[0] !== b.span[0]) return a.span[0] - b.span[0];
    const aWeight = severityWeight[a.severity] * 10 + (evidenceWeight[a.evidenceStatus] || 0);
    const bWeight = severityWeight[b.severity] * 10 + (evidenceWeight[b.evidenceStatus] || 0);
    return bWeight - aWeight;
  });

  const result: Finding[] = [];
  const usedSpans = new Set<string>();

  for (const finding of sorted) {
    const spanKey = `${finding.span[0]}-${finding.span[1]}`;

    // Check for overlapping spans
    let overlaps = false;
    for (const existing of result) {
      if (
        finding.span[0] < existing.span[1] &&
        finding.span[1] > existing.span[0] &&
        finding.category === existing.category
      ) {
        overlaps = true;
        break;
      }
    }

    if (!overlaps || !usedSpans.has(spanKey)) {
      result.push(finding);
      usedSpans.add(spanKey);
    }
  }

  return result;
}

/**
 * Compute summary metrics for a set of findings.
 */
function computeSummary(findings: Finding[]): ScanSummary {
  const byCategory: Record<FindingCategory, number> = {
    terminology: 0,
    claim: 0,
    tone: 0,
    policy: 0,
  };

  const bySeverity: Record<Severity, number> = {
    high: 0,
    medium: 0,
    low: 0,
  };

  const byEvidence: Partial<Record<EvidenceStatus, number>> = {};

  for (const f of findings) {
    byCategory[f.category]++;
    bySeverity[f.severity]++;
    byEvidence[f.evidenceStatus] = (byEvidence[f.evidenceStatus] || 0) + 1;
  }

  // Risk score: weighted sum normalised to 0–100
  const riskScore = Math.min(
    100,
    Math.round(
      (bySeverity.high * 15 + bySeverity.medium * 8 + bySeverity.low * 2) *
        (100 / Math.max(findings.length * 15, 1))
    )
  );

  return {
    total: findings.length,
    byCategory,
    bySeverity,
    byEvidence,
    riskScore,
  };
}

/**
 * Run the complete governance check pipeline on the input text.
 */
export function runGovernanceCheck(
  text: string,
  rules: BrandRule[],
  facts: ApprovedFact[]
): ScanResult {
  const startTime = performance.now();

  // Reset counters for clean IDs
  resetFindingCounter();
  resetFactFindingCounter();

  // Run checks in parallel (conceptually — both are synchronous and fast)
  const ruleFindings = matchRules(text, rules);
  const factFindings = verifyFacts(text, facts);

  // Merge and deduplicate
  const allFindings = deduplicateFindings([...ruleFindings, ...factFindings]);

  // Sort findings by position in text for natural reading order
  allFindings.sort((a, b) => a.span[0] - b.span[0]);

  const durationMs = Math.round(performance.now() - startTime);

  return {
    findings: allFindings,
    summary: computeSummary(allFindings),
    scannedAt: new Date().toISOString(),
    durationMs,
  };
}

export const scanDraft = runGovernanceCheck;
