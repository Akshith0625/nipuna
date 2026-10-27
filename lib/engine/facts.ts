/*
 * Nipuna — Evidence-Linked Fact Verification Engine
 * 3-state verdict: supported, conflict, not_verified.
 * Zero hallucinated sources — every cited source ID is confirmed to exist in the database.
 */

import type { ApprovedFact, Finding } from "./types";

let factFindingCounter = 0;

function nextFactFindingId(): string {
  factFindingCounter += 1;
  return `fact-${factFindingCounter}-${Date.now()}`;
}

export function resetFactFindingCounter(): void {
  factFindingCounter = 0;
}

/* ---------- Claim Extraction ---------- */

interface ExtractedClaim {
  text: string;
  span: [number, number];
  type: "numeric" | "date" | "entity" | "capability";
  extractedValue?: string;
  extractedEntity?: string;
}

/**
 * Extract factual assertions from text — numbers, dates, percentages,
 * geographic claims, capability claims.
 */
function extractClaims(text: string): ExtractedClaim[] {
  const claims: ExtractedClaim[] = [];

  // Numeric claims: "50,000 customers", "500+ clients", "$8.5 million", "120 employees"
  const numericPatterns = [
    /\b(\d[\d,]*\+?)\s+(customers?|clients?|users?|employees?|team members?|partners?|countries|markets|regions)/gi,
    /\b\$?([\d,.]+)\s*(million|billion|thousand|M|B|K)\b/gi,
    /\b(\d[\d,.]*%)\s*(uptime|accuracy|reduction|improvement|growth|SLA)/gi,
    /\b(under|over|more than|less than|approximately|about|around)\s+(\d[\d,.]*)\s+(hours?|minutes?|days?|weeks?|months?)/gi,
    /\b(\d[\d,.]*)\s*(million|billion)?\s*(documents?|reviews?|transactions?|requests?)\s*(per|a|each)\s*(month|day|week|year)/gi,
  ];

  for (const pattern of numericPatterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      claims.push({
        text: match[0],
        span: [match.index, match.index + match[0].length],
        type: "numeric",
        extractedValue: match[0],
      });
    }
  }

  // Date / founding claims: "Founded in 2019", "established in"
  const datePatterns = [
    /\b(?:founded|established|started|launched|incorporated)\s+(?:in\s+)?(\d{4})/gi,
    /\b(?:founded|established|started|launched|incorporated)\s+(?:in\s+)?(\d{4})\s+(?:in\s+)?([\w\s]+?)(?:\.|,|$)/gim,
    /\bsince\s+(\d{4})\b/gi,
    /\bfor\s+(?:over|more than)\s+(\w+)\s+(?:years?|decades?)/gi,
  ];

  for (const pattern of datePatterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      claims.push({
        text: match[0],
        span: [match.index, match.index + match[0].length],
        type: "date",
        extractedValue: match[1],
      });
    }
  }

  // Certification claims
  const certPatterns = [
    /\b(ISO\s*\d{4,5}(?::\d{4})?|SOC\s*\d\s*(?:Type\s*I{1,2})?|GDPR|HIPAA|PCI[\s-]DSS)/gi,
  ];

  for (const pattern of certPatterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      claims.push({
        text: match[0],
        span: [match.index, match.index + match[0].length],
        type: "entity",
        extractedValue: match[0],
        extractedEntity: "security_certifications",
      });
    }
  }

  // Pricing claims
  const pricingPatterns = [
    /\$\d[\d,.]*\s*\/?\s*(?:per\s+)?(?:month|year|user|seat)/gi,
  ];

  for (const pattern of pricingPatterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      claims.push({
        text: match[0],
        span: [match.index, match.index + match[0].length],
        type: "numeric",
        extractedValue: match[0],
      });
    }
  }

  // Deduplicate by span
  const seen = new Set<string>();
  return claims.filter((c) => {
    const key = `${c.span[0]}-${c.span[1]}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/* ---------- Fact Matching ---------- */

function normaliseForComparison(str: string): string {
  return str
    .toLowerCase()
    .replace(/[,.\-+$%]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Find the best matching fact for a claim.
 * Returns { fact, verdict } where verdict is "supported" | "conflict" | null.
 */
function matchClaimToFact(
  claim: ExtractedClaim,
  facts: ApprovedFact[]
): { fact: ApprovedFact; verdict: "supported" | "conflict" } | null {
  const claimNorm = normaliseForComparison(claim.text);

  for (const fact of facts) {
    if (fact.status !== "active") continue;

    const factValueNorm = normaliseForComparison(fact.value);
    const factStatementNorm = normaliseForComparison(fact.statement);

    // Check if the claim references the same entity
    const entityRelevant =
      claimNorm.includes(factValueNorm) ||
      factStatementNorm.includes(claimNorm) ||
      hasSemanticOverlap(claimNorm, factStatementNorm);

    if (!entityRelevant) continue;

    // Check for direct support
    if (claimNorm.includes(factValueNorm)) {
      return { fact, verdict: "supported" };
    }

    // Check for conflict — same entity, different value
    if (isConflicting(claim, fact)) {
      return { fact, verdict: "conflict" };
    }
  }
  return null;
}

/**
 * Check if claim and fact reference the same domain but with conflicting values.
 */
function isConflicting(claim: ExtractedClaim, fact: ApprovedFact): boolean {
  const claimText = claim.text.toLowerCase();
  const factStatement = fact.statement.toLowerCase();

  // Founding year conflict
  if (fact.entity === "founding_year") {
    const yearMatch = claimText.match(/\b(19|20)\d{2}\b/);
    if (yearMatch && !factStatement.includes(yearMatch[0])) {
      // Both talk about founding but cite different years
      if (
        claimText.includes("found") ||
        claimText.includes("establish") ||
        claimText.includes("start") ||
        claimText.includes("since")
      ) {
        return true;
      }
    }
  }

  // Client count conflict
  if (fact.entity === "client_count") {
    const claimNumbers = claimText.match(/\d[\d,]*/g);
    const factNumbers = fact.value.match(/\d[\d,]*/g);
    if (claimNumbers && factNumbers) {
      const claimNum = parseInt(claimNumbers[0].replace(/,/g, ""));
      const factNum = parseInt(factNumbers[0].replace(/,/g, ""));
      if (
        (claimText.includes("customer") || claimText.includes("client")) &&
        claimNum !== factNum &&
        Math.abs(claimNum - factNum) / factNum > 0.1
      ) {
        return true;
      }
    }
  }

  // Employee count conflict
  if (fact.entity === "employee_count") {
    const claimNumbers = claimText.match(/\d[\d,]*/g);
    if (claimNumbers && (claimText.includes("employee") || claimText.includes("team"))) {
      const claimNum = parseInt(claimNumbers[0].replace(/,/g, ""));
      const factNum = parseInt(fact.value.replace(/,/g, ""));
      if (claimNum !== factNum) return true;
    }
  }

  return false;
}

function hasSemanticOverlap(a: string, b: string): boolean {
  const keywordsA = new Set(a.split(" ").filter((w) => w.length > 3));
  const keywordsB = new Set(b.split(" ").filter((w) => w.length > 3));
  let overlap = 0;
  for (const kw of keywordsA) {
    if (keywordsB.has(kw)) overlap++;
  }
  return overlap >= 2;
}

/**
 * Find the nearest (most topically relevant) fact for an unmatched claim.
 */
function findNearestFact(claim: ExtractedClaim, facts: ApprovedFact[]): ApprovedFact | null {
  const claimText = claim.text.toLowerCase();
  let bestFact: ApprovedFact | null = null;
  let bestScore = 0;

  for (const fact of facts) {
    if (fact.status !== "active") continue;
    const factText = fact.statement.toLowerCase();

    // Compute word overlap score
    const claimWords = new Set(claimText.split(/\W+/).filter((w) => w.length > 2));
    const factWords = new Set(factText.split(/\W+/).filter((w) => w.length > 2));
    let score = 0;
    for (const w of claimWords) {
      if (factWords.has(w)) score++;
    }

    // Boost for entity type match
    if (claim.type === "numeric" && /\d/.test(fact.value)) score += 0.5;
    if (claim.type === "date" && fact.entity === "founding_year") score += 1;

    if (score > bestScore) {
      bestScore = score;
      bestFact = fact;
    }
  }

  return bestScore >= 1 ? bestFact : null;
}

/* ---------- Public API ---------- */

/**
 * Verify all factual claims in the text against approved facts.
 * Produces findings with 3-state verdicts: supported, conflict, not_verified.
 */
export function verifyFacts(text: string, facts: ApprovedFact[]): Finding[] {
  const claims = extractClaims(text);
  const findings: Finding[] = [];

  for (const claim of claims) {
    const result = matchClaimToFact(claim, facts);

    if (result) {
      if (result.verdict === "supported") {
        findings.push({
          id: nextFactFindingId(),
          category: "claim",
          matchedText: claim.text,
          span: claim.span,
          severity: "low",
          evidenceStatus: "supported",
          sourceId: result.fact.id,
          explanation: `Claim matches approved fact ${result.fact.id}: "${result.fact.statement}" [Source: ${result.fact.sourceReference}]`,
          confidence: 0.95,
          decision: "pending",
        });
      } else {
        // Conflict
        findings.push({
          id: nextFactFindingId(),
          category: "claim",
          matchedText: claim.text,
          span: claim.span,
          severity: "high",
          evidenceStatus: "conflict",
          sourceId: result.fact.id,
          explanation: `Claim directly conflicts with approved fact ${result.fact.id}: "${result.fact.statement}". The approved value is "${result.fact.value}". [Source: ${result.fact.sourceReference}]`,
          suggestedFix: buildFactCorrectionText(claim, result.fact),
          intentRationale: `Replaces the incorrect claim with the verified approved value while preserving the sentence structure.`,
          confidence: 0.98,
          decision: "pending",
        });
      }
    } else {
      // Not verified — find nearest fact for context
      const nearest = findNearestFact(claim, facts);

      findings.push({
        id: nextFactFindingId(),
        category: "claim",
        matchedText: claim.text,
        span: claim.span,
        severity: "medium",
        evidenceStatus: "not_verified",
        nearestSourceId: nearest?.id,
        explanation: nearest
          ? `Not verified in approved sources. Nearest approved fact is ${nearest.id}: "${nearest.statement}". This is an evidence gap, not a ruling that the claim is false.`
          : `Not verified in approved sources. No closely related approved fact was found. This is an evidence gap, not a ruling that the claim is false.`,
        suggestedFix: nearest
          ? buildFactCorrectionText(claim, nearest)
          : undefined,
        intentRationale: nearest
          ? `Suggests replacing with the nearest verified figure to maintain credibility.`
          : undefined,
        confidence: 0.7,
        decision: "pending",
      });
    }
  }

  return findings;
}

/**
 * Build a corrected text snippet using the approved fact value.
 */
function buildFactCorrectionText(claim: ExtractedClaim, fact: ApprovedFact): string {
  // For founding year conflicts
  if (fact.entity === "founding_year") {
    return claim.text.replace(/\b(19|20)\d{2}\b/, fact.value);
  }

  // For client/customer count
  if (fact.entity === "client_count") {
    const corrected = claim.text.replace(/\d[\d,]*\+?/, fact.value);
    // Also fix "customers" -> "clients" if needed
    return corrected.replace(/customers?/gi, "enterprise clients");
  }

  // For employee count
  if (fact.entity === "employee_count") {
    return claim.text.replace(/\d[\d,]*/, fact.value);
  }

  // Generic: return fact statement
  return fact.value;
}
