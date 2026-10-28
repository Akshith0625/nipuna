/*
 * Nipuna — Deterministic Rule Engine
 * Matches draft text against brand rules using inflected-form-aware phrase matching.
 * Zero external dependencies — runs entirely client-side with guaranteed sub-100ms execution.
 */

import type { BrandRule, Finding } from "./types";

let findingCounter = 0;

function nextFindingId(): string {
  findingCounter += 1;
  return `find-${findingCounter}-${Date.now()}`;
}

export function resetFindingCounter(): void {
  findingCounter = 0;
}

/**
 * Build a case-insensitive regex that matches any of the prohibited forms
 * as whole words (bounded by word boundaries or punctuation).
 */
function buildProhibitedRegex(forms: string[]): RegExp | null {
  if (forms.length === 0) return null;

  const escaped = forms.map((f) =>
    f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );
  // Match whole words — handles punctuation boundaries
  const pattern = `\\b(${escaped.join("|")})\\b`;
  return new RegExp(pattern, "gi");
}

/**
 * Detect ALL CAPS words that are 3+ characters and not common acronyms.
 */
const KNOWN_ACRONYMS = new Set([
  "ISO", "SOC", "SLA", "API", "SDK", "CRM", "HRIS", "CEO", "CTO", "CFO",
  "USA", "UAE", "AWS", "GCP", "PDF", "URL", "FAQ", "HTML", "CSS", "SQL",
]);

function findAllCapsWords(text: string): { word: string; start: number; end: number }[] {
  const regex = /\b([A-Z]{3,})\b/g;
  const matches: { word: string; start: number; end: number }[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const word = match[1];
    if (!KNOWN_ACRONYMS.has(word)) {
      matches.push({ word, start: match.index, end: match.index + word.length });
    }
  }
  return matches;
}

/**
 * Generate the intent-aware replacement text for a terminology match.
 */
function mapReplacement(rule: BrandRule, matchedText: string): string | undefined {
  if (!rule.replacement) return undefined;

  // Preserve capitalisation pattern of original text
  if (matchedText[0] === matchedText[0].toUpperCase() && rule.replacement[0]) {
    return rule.replacement[0].toUpperCase() + rule.replacement.slice(1);
  }
  return rule.replacement;
}

/**
 * Generate the rationale for why a correction preserves the author's intent.
 */
function intentRationaleFor(rule: BrandRule, matchedText: string): string {
  switch (rule.category) {
    case "terminology":
      return `Replaces "${matchedText}" with the approved equivalent while keeping the sentence meaning intact.`;
    case "tone":
      return `Adjusts tone to match brand voice guidelines without changing the underlying message.`;
    case "claim":
      return `Removes or qualifies the claim to meet compliance requirements while preserving the factual content.`;
    default:
      return `Correction maintains the communicative purpose of the original text.`;
  }
}

/**
 * Run all brand rules against the input text.
 * Returns an array of findings with precise character offsets.
 */
export function matchRules(text: string, rules: BrandRule[]): Finding[] {
  const findings: Finding[] = [];

  for (const rule of rules) {
    if (!rule.active) continue;

    // Standard prohibited-form matching
    if (rule.prohibitedForms.length > 0) {
      const regex = buildProhibitedRegex(rule.prohibitedForms);
      if (!regex) continue;

      let match: RegExpExecArray | null;
      while ((match = regex.exec(text)) !== null) {
        const matchedText = match[0];
        const start = match.index;
        const end = start + matchedText.length;

        const replacement = mapReplacement(rule, matchedText);

        findings.push({
          id: nextFindingId(),
          category: rule.category,
          matchedText,
          span: [start, end],
          severity: rule.severity,
          evidenceStatus: "rule_match",
          ruleId: rule.id,
          explanation: `${rule.description} [Rule ${rule.id} v${rule.version}]`,
          suggestedFix: replacement,
          intentRationale: replacement
            ? intentRationaleFor(rule, matchedText)
            : undefined,
          confidence: 1.0,
          decision: "pending",
        });
      }
    }

    // Special handler: ALL CAPS detection (TG-02)
    if (rule.id === "TG-02" && rule.active) {
      const capsMatches = findAllCapsWords(text);
      for (const cm of capsMatches) {
        // Skip if this word is already covered by another rule match
        const alreadyCovered = findings.some(
          (f) => f.span[0] === cm.start && f.span[1] === cm.end
        );
        if (alreadyCovered) continue;

        findings.push({
          id: nextFindingId(),
          category: "tone",
          matchedText: cm.word,
          span: [cm.start, cm.end],
          severity: rule.severity,
          evidenceStatus: "tone_heuristic",
          ruleId: rule.id,
          explanation: `"${cm.word}" uses ALL CAPS, which reads as shouting. Consider sentence case unless it is a recognised acronym. [Rule ${rule.id} v${rule.version}]`,
          suggestedFix: cm.word[0] + cm.word.slice(1).toLowerCase(),
          intentRationale: `Converts to sentence case while preserving the word's meaning.`,
          confidence: 0.85,
          decision: "pending",
        });
      }
    }
  }

  return findings;
}
