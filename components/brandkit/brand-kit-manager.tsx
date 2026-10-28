"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import type {
  BrandRule,
  ApprovedFact,
  FindingCategory,
  Severity,
} from "@/lib/engine/types";

interface BrandKitManagerProps {
  rules: BrandRule[];
  facts: ApprovedFact[];
  onAddRule: (rule: BrandRule) => void;
  onUpdateRule: (rule: BrandRule) => void;
  onDeleteRule: (id: string) => void;
  onAddFact: (fact: ApprovedFact) => void;
  onUpdateFact: (fact: ApprovedFact) => void;
  onDeleteFact: (id: string) => void;
  onResetToDemo: () => void;
  role: "creator" | "reviewer" | "admin";
}

const CATEGORY_LABELS: Record<FindingCategory, string> = {
  terminology: "Terminology",
  claim: "Claims & Superlatives",
  tone: "Tone & Voice",
  policy: "Policy & Compliance",
};

const SEVERITY_BADGES: Record<Severity, string> = {
  high: "bg-[#f7d4d6] text-[#c50000] dark:bg-[rgba(238,0,0,0.12)] dark:text-[#ff6666] border-[#f7d4d6] dark:border-[rgba(238,0,0,0.2)]",
  medium: "bg-[#ffefcf] text-[#ab570a] dark:bg-[rgba(245,166,35,0.12)] dark:text-[#f5a623] border-[#ffefcf] dark:border-[rgba(245,166,35,0.2)]",
  low: "bg-[#d3e5ff] text-[#0761d1] dark:bg-[rgba(0,112,243,0.12)] dark:text-[#3291ff] border-[#d3e5ff] dark:border-[rgba(0,112,243,0.2)]",
};

export default function BrandKitManager({
  rules,
  facts,
  onAddRule,
  onUpdateRule,
  onDeleteRule,
  onAddFact,
  onUpdateFact,
  onDeleteFact,
  onResetToDemo,
  role,
}: BrandKitManagerProps) {
  const [activeSubTab, setActiveSubTab] = useState<"rules" | "facts">("rules");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | FindingCategory>("all");

  // Rule Form state
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleName, setRuleName] = useState("");
  const [ruleCategory, setRuleCategory] = useState<FindingCategory>("terminology");
  const [ruleSeverity, setRuleSeverity] = useState<Severity>("medium");
  const [ruleProhibited, setRuleProhibited] = useState("");
  const [ruleReplacement, setRuleReplacement] = useState("");
  const [ruleRationale, setRuleRationale] = useState("");
  const [ruleDesc, setRuleDesc] = useState("");

  // Fact Form state
  const [isAddingFact, setIsAddingFact] = useState(false);
  const [editingFactId, setEditingFactId] = useState<string | null>(null);
  const [factStatement, setFactStatement] = useState("");
  const [factValue, setFactValue] = useState("");
  const [factEntity, setFactEntity] = useState("");
  const [factOwner, setFactOwner] = useState("Legal");
  const [factSource, setFactSource] = useState("");
  const [factValidFrom, setFactValidFrom] = useState(
    new Date().toISOString().split("T")[0]
  );

  const canEdit = role === "admin" || role === "reviewer";

  // Filtered Rules
  const filteredRules = rules.filter((r) => {
    const matchesCat = categoryFilter === "all" || r.category === categoryFilter;
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.prohibitedForms.some((f) =>
        f.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      r.rationale.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Filtered Facts
  const filteredFacts = facts.filter((f) => {
    const matchesSearch =
      f.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.statement.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.owner.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Handlers for Rule Modals
  function openAddRule() {
    setEditingRuleId(null);
    setRuleName("");
    setRuleCategory("terminology");
    setRuleSeverity("medium");
    setRuleProhibited("");
    setRuleReplacement("");
    setRuleRationale("");
    setRuleDesc("");
    setIsAddingRule(true);
  }

  function openEditRule(rule: BrandRule) {
    setEditingRuleId(rule.id);
    setRuleName(rule.name);
    setRuleCategory(rule.category);
    setRuleSeverity(rule.severity);
    setRuleProhibited(rule.prohibitedForms.join(", "));
    setRuleReplacement(rule.replacement || "");
    setRuleRationale(rule.rationale);
    setRuleDesc(rule.description);
    setIsAddingRule(true);
  }

  function handleSaveRule(e: React.FormEvent) {
    e.preventDefault();
    if (!ruleName.trim()) return;

    const prohibitedList = ruleProhibited
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    if (editingRuleId) {
      const existing = rules.find((r) => r.id === editingRuleId);
      if (!existing) return;
      onUpdateRule({
        ...existing,
        name: ruleName.trim(),
        category: ruleCategory,
        severity: ruleSeverity,
        prohibitedForms: prohibitedList,
        replacement: ruleReplacement.trim() || undefined,
        rationale: ruleRationale.trim(),
        description: ruleDesc.trim() || ruleName.trim(),
        version: existing.version + 1,
      });
    } else {
      const prefix =
        ruleCategory === "terminology"
          ? "T"
          : ruleCategory === "claim"
          ? "C"
          : ruleCategory === "tone"
          ? "TG"
          : "P";
      const newId = `${prefix}-0${rules.length + 1}`;

      onAddRule({
        id: newId,
        name: ruleName.trim(),
        category: ruleCategory,
        severity: ruleSeverity,
        pattern: prohibitedList.join("|"),
        prohibitedForms: prohibitedList,
        replacement: ruleReplacement.trim() || undefined,
        rationale: ruleRationale.trim(),
        description: ruleDesc.trim() || ruleName.trim(),
        version: 1,
        active: true,
      });
    }

    setIsAddingRule(false);
  }

  // Handlers for Fact Modals
  function openAddFact() {
    setEditingFactId(null);
    setFactStatement("");
    setFactValue("");
    setFactEntity("");
    setFactOwner("Legal");
    setFactSource("");
    setFactValidFrom(new Date().toISOString().split("T")[0]);
    setIsAddingFact(true);
  }

  function openEditFact(fact: ApprovedFact) {
    setEditingFactId(fact.id);
    setFactStatement(fact.statement);
    setFactValue(fact.value);
    setFactEntity(fact.entity);
    setFactOwner(fact.owner);
    setFactSource(fact.sourceReference);
    setFactValidFrom(fact.validFrom);
    setIsAddingFact(true);
  }

  function handleSaveFact(e: React.FormEvent) {
    e.preventDefault();
    if (!factStatement.trim() || !factValue.trim()) return;

    if (editingFactId) {
      const existing = facts.find((f) => f.id === editingFactId);
      if (!existing) return;
      onUpdateFact({
        ...existing,
        statement: factStatement.trim(),
        value: factValue.trim(),
        entity: factEntity.trim() || "general",
        owner: factOwner.trim(),
        sourceReference: factSource.trim() || "Internal Documentation",
        validFrom: factValidFrom,
      });
    } else {
      const newId = `F-0${facts.length + 1}`;
      onAddFact({
        id: newId,
        statement: factStatement.trim(),
        value: factValue.trim(),
        entity: factEntity.trim() || "general",
        owner: factOwner.trim(),
        sourceReference: factSource.trim() || "Internal Documentation",
        validFrom: factValidFrom,
        status: "active",
      });
    }

    setIsAddingFact(false);
  }

  function handleExportJson() {
    const data = JSON.stringify({ rules, facts }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nipuna-brand-governance-kit.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col flex-1 h-full overflow-y-auto bg-canvas-soft">
      {/* Top Banner & Header */}
      <div className="border-b border-hairline p-6 bg-canvas">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-6xl mx-auto w-full">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-caption-mono uppercase tracking-wider px-2 py-0.5 rounded-[4px] bg-canvas-soft-2 text-ink border border-hairline font-semibold">
                Single Source of Truth
              </span>
              <span className="text-hairline-strong text-caption">·</span>
              <span className="text-caption text-mute">
                Inkloom Corp Brand Kit
              </span>
            </div>
            <h1 className="text-display-sm text-ink">
              Brand Governance Kit & Facts Registry
            </h1>
            <p className="text-body-sm text-body mt-1 max-w-2xl">
              Configure deterministic terminology rules, claim boundaries, and verified organizational facts. Every check run by Nipuna strictly adheres to these definitions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJson}
              className="btn-pill btn-pill-secondary text-caption !h-auto py-1.5 px-3"
              title="Download full kit as JSON"
            >
              Export JSON
            </button>
            <button
              onClick={onResetToDemo}
              className="btn-pill btn-pill-secondary text-caption !h-auto py-1.5 px-3 text-mute hover:text-ink"
              title="Reset rules and facts back to initial benchmark kit"
            >
              Reset to Benchmark
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto w-full p-6 space-y-6">
        {/* Navigation & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-4">
          {/* Sub-tabs */}
          <div className="flex items-center gap-1 bg-canvas-soft-2 p-1 rounded-[64px] border border-hairline">
            <button
              onClick={() => {
                setActiveSubTab("rules");
                setCategoryFilter("all");
              }}
              className={cn(
                "px-4 py-1 text-caption font-medium rounded-[64px] transition-base",
                activeSubTab === "rules"
                  ? "bg-canvas shadow-xs text-ink font-semibold"
                  : "text-mute hover:text-body"
              )}
            >
              Brand Rules ({rules.length})
            </button>
            <button
              onClick={() => {
                setActiveSubTab("facts");
                setCategoryFilter("all");
              }}
              className={cn(
                "px-4 py-1 text-caption font-medium rounded-[64px] transition-base",
                activeSubTab === "facts"
                  ? "bg-canvas shadow-xs text-ink font-semibold"
                  : "text-mute hover:text-body"
              )}
            >
              Approved Facts Registry ({facts.length})
            </button>
          </div>

          {/* Search & Add */}
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeSubTab === "rules"
                  ? "Search rules, terms, IDs..."
                  : "Search facts, values, sources..."
              }
              className="px-3 py-1.5 text-caption border border-hairline rounded-[6px] bg-canvas text-ink placeholder:text-mute focus:outline-none focus:ring-1 focus:ring-link w-56"
            />

            {canEdit && (
              <button
                onClick={activeSubTab === "rules" ? openAddRule : openAddFact}
                className="btn-pill btn-pill-primary text-caption !h-auto py-1.5 px-3 flex items-center gap-1.5 shrink-0"
              >
                <span>+</span>
                <span>{activeSubTab === "rules" ? "Add Rule" : "Add Fact"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Pills (for Rules) */}
        {activeSubTab === "rules" && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-caption">
            <button
              onClick={() => setCategoryFilter("all")}
              className={cn(
                "px-3 py-1 rounded-[100px] border transition-base font-medium",
                categoryFilter === "all"
                  ? "bg-accent text-on-primary border-accent"
                  : "border-hairline text-body hover:bg-canvas-soft-2"
              )}
            >
              All Categories ({rules.length})
            </button>
            {(["terminology", "claim", "tone", "policy"] as FindingCategory[]).map(
              (cat) => {
                const count = rules.filter((r) => r.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={cn(
                      "px-3 py-1 rounded-[100px] border transition-base font-medium",
                      categoryFilter === cat
                        ? "bg-accent text-on-primary border-accent"
                        : "border-hairline text-body hover:bg-canvas-soft-2"
                    )}
                  >
                    {CATEGORY_LABELS[cat]} ({count})
                  </button>
                );
              }
            )}
          </div>
        )}

        {/* ================= RULES LIST ================= */}
        {activeSubTab === "rules" && (
          <div className="space-y-3">
            {filteredRules.length === 0 ? (
              <div className="py-12 text-center text-mute text-body-sm">
                No brand rules found matching your filter.
              </div>
            ) : (
              filteredRules.map((rule) => (
                <div
                  key={rule.id}
                  className={cn(
                    "p-4 rounded-[8px] border bg-canvas transition-base shadow-xs",
                    rule.active
                      ? "border-hairline hover:border-hairline-strong"
                      : "border-hairline opacity-60 bg-canvas-soft-2"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-code font-bold px-1.5 py-0.5 rounded-[4px] bg-canvas-soft-2 text-ink border border-hairline">
                          {rule.id}
                        </span>
                        <span className="text-body-sm-strong text-ink">
                          {rule.name}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] uppercase font-bold font-mono px-1.5 py-0.5 rounded-[4px] border",
                            SEVERITY_BADGES[rule.severity]
                          )}
                        >
                          {rule.severity}
                        </span>
                        <span className="text-caption-mono text-mute">
                          v{rule.version}
                        </span>
                        <span className="text-hairline-strong text-caption">·</span>
                        <span className="text-caption font-medium text-body">
                          {CATEGORY_LABELS[rule.category]}
                        </span>
                        {!rule.active && (
                          <span className="text-[10px] uppercase px-1.5 py-0.5 rounded-[4px] bg-canvas-soft-2 text-mute font-bold">
                            Disabled
                          </span>
                        )}
                      </div>

                      <p className="text-caption text-body">
                        {rule.description}
                      </p>

                      {/* Prohibited & Replacement */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-caption pt-1">
                        {rule.prohibitedForms.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-mute">Prohibited:</span>
                            <div className="flex flex-wrap gap-1">
                              {rule.prohibitedForms.map((p, i) => (
                                <code
                                  key={i}
                                  className="px-1.5 py-0.2 rounded-[4px] bg-[#f7d4d6] text-[#c50000] dark:bg-[rgba(238,0,0,0.12)] dark:text-[#ff6666] border border-hairline text-code"
                                >
                                  {p}
                                </code>
                              ))}
                            </div>
                          </div>
                        )}

                        {rule.replacement && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-mute">Approved Fix:</span>
                            <code className="px-1.5 py-0.2 rounded-[4px] bg-[#dcfce7] text-[#166534] dark:bg-[rgba(22,101,52,0.2)] dark:text-[#86efac] border border-hairline text-code font-medium">
                              {rule.replacement}
                            </code>
                          </div>
                        )}
                      </div>

                      {rule.rationale && (
                        <p className="text-caption text-mute italic pt-0.5">
                          Rationale: {rule.rationale}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    {canEdit && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() =>
                            onUpdateRule({
                              ...rule,
                              active: !rule.active,
                              version: rule.version + 1,
                            })
                          }
                          className={cn(
                            "px-2.5 py-1 text-caption font-medium rounded-[100px] border transition-base",
                            rule.active
                              ? "border-hairline text-body hover:bg-canvas-soft-2"
                              : "border-[#0070f3] text-[#0070f3] dark:text-[#3291ff] hover:bg-[#d3e5ff]/20"
                          )}
                        >
                          {rule.active ? "Disable" : "Enable"}
                        </button>
                        <button
                          onClick={() => openEditRule(rule)}
                          className="px-2.5 py-1 text-caption font-medium rounded-[100px] border border-hairline hover:bg-canvas-soft-2 text-body transition-base"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteRule(rule.id)}
                          className="px-2.5 py-1 text-caption font-medium rounded-[100px] border border-hairline text-[#ee0000] dark:text-[#ff6666] hover:bg-[#f7d4d6]/20 transition-base"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ================= FACTS REGISTRY ================= */}
        {activeSubTab === "facts" && (
          <div className="space-y-3">
            <div className="p-3 bg-canvas border border-hairline rounded-[8px] text-caption text-body shadow-xs">
              <strong>Ground Truth Integrity:</strong> Every claim verified by the Fact Engine is resolved against this registry. Any assertion contradicting these records produces a <code className="text-[#ee0000] font-mono font-bold">conflict</code> verdict; unbacked claims produce a <code className="text-[#ab570a] font-mono font-bold">not_verified</code> verdict.
            </div>

            {filteredFacts.length === 0 ? (
              <div className="py-12 text-center text-mute text-body-sm">
                No approved facts found matching your query.
              </div>
            ) : (
              filteredFacts.map((fact) => (
                <div
                  key={fact.id}
                  className="p-4 rounded-[8px] border border-hairline bg-canvas hover:border-hairline-strong transition-base space-y-2 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-code font-bold px-1.5 py-0.5 rounded-[4px] bg-[#dcfce7] text-[#166534] dark:bg-[rgba(22,101,52,0.2)] dark:text-[#86efac] border border-hairline">
                          {fact.id}
                        </span>
                        <span className="text-body-sm-strong text-ink">
                          {fact.statement}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-caption pt-1">
                        <div>
                          <span className="text-mute block text-[10px] uppercase font-mono">
                            Exact Value / Entity
                          </span>
                          <span className="font-mono text-caption text-ink font-medium">
                            {fact.value} ({fact.entity})
                          </span>
                        </div>
                        <div>
                          <span className="text-mute block text-[10px] uppercase font-mono">
                            Verified Source Reference
                          </span>
                          <span className="text-caption text-body truncate block">
                            {fact.sourceReference}
                          </span>
                        </div>
                        <div>
                          <span className="text-mute block text-[10px] uppercase font-mono">
                            Owner / Validity
                          </span>
                          <span className="text-caption text-body">
                            {fact.owner} · Valid from {fact.validFrom}
                          </span>
                        </div>
                      </div>
                    </div>

                    {canEdit && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => openEditFact(fact)}
                          className="px-2.5 py-1 text-caption font-medium rounded-[100px] border border-hairline hover:bg-canvas-soft-2 text-body transition-base"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteFact(fact.id)}
                          className="px-2.5 py-1 text-caption font-medium rounded-[100px] border border-hairline text-[#ee0000] dark:text-[#ff6666] hover:bg-[#f7d4d6]/20 transition-base"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ================= MODAL: ADD / EDIT RULE ================= */}
      {isAddingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-canvas border border-hairline rounded-[12px] shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <h2 className="text-body-sm-strong text-ink">
                {editingRuleId ? `Edit Rule ${editingRuleId}` : "Create Brand Rule"}
              </h2>
              <button
                onClick={() => setIsAddingRule(false)}
                className="text-mute hover:text-ink text-[14px]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-4 text-caption">
              <div>
                <label className="block text-caption font-semibold text-body mb-1">
                  Rule Name *
                </label>
                <input
                  type="text"
                  required
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="e.g. Prohibited competitor comparison"
                  className="w-full px-3 py-1.5 border border-hairline rounded-[6px] bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-link"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-caption font-semibold text-body mb-1">
                    Category
                  </label>
                  <select
                    value={ruleCategory}
                    onChange={(e) =>
                      setRuleCategory(e.target.value as FindingCategory)
                    }
                    className="w-full px-3 py-1.5 border border-hairline rounded-[6px] bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-link"
                  >
                    <option value="terminology">Terminology</option>
                    <option value="claim">Claim / Superlative</option>
                    <option value="tone">Tone & Voice</option>
                    <option value="policy">Policy / Compliance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-caption font-semibold text-body mb-1">
                    Severity
                  </label>
                  <select
                    value={ruleSeverity}
                    onChange={(e) => setRuleSeverity(e.target.value as Severity)}
                    className="w-full px-3 py-1.5 border border-hairline rounded-[6px] bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-link"
                  >
                    <option value="high">High (Blocker)</option>
                    <option value="medium">Medium (Warning)</option>
                    <option value="low">Low (Advisory)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-caption font-semibold text-body mb-1">
                  Prohibited Forms (comma-separated)
                </label>
                <input
                  type="text"
                  value={ruleProhibited}
                  onChange={(e) => setRuleProhibited(e.target.value)}
                  placeholder="e.g. utilize, utilizes, utilization"
                  className="w-full px-3 py-1.5 border border-hairline rounded-[6px] bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-link"
                />
                <span className="text-[11px] text-mute mt-0.5 block">
                  The engine matches each term with word-boundary and inflection awareness.
                </span>
              </div>

              <div>
                <label className="block text-caption font-semibold text-body mb-1">
                  Intent-Preserving Approved Replacement
                </label>
                <input
                  type="text"
                  value={ruleReplacement}
                  onChange={(e) => setRuleReplacement(e.target.value)}
                  placeholder="e.g. use"
                  className="w-full px-3 py-1.5 border border-hairline rounded-[6px] bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-link"
                />
              </div>

              <div>
                <label className="block text-caption font-semibold text-body mb-1">
                  Description & Guidance
                </label>
                <textarea
                  rows={2}
                  value={ruleDesc}
                  onChange={(e) => setRuleDesc(e.target.value)}
                  placeholder="Explain why this rule exists..."
                  className="w-full px-3 py-1.5 border border-hairline rounded-[6px] bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-link resize-none"
                />
              </div>

              <div>
                <label className="block text-caption font-semibold text-body mb-1">
                  Official Rationale
                </label>
                <input
                  type="text"
                  value={ruleRationale}
                  onChange={(e) => setRuleRationale(e.target.value)}
                  placeholder="e.g. Brand voice guidelines mandate plain language"
                  className="w-full px-3 py-1.5 border border-hairline rounded-[6px] bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-link"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setIsAddingRule(false)}
                  className="btn-pill btn-pill-secondary text-caption !h-auto py-1.5 px-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-pill btn-pill-primary text-caption !h-auto py-1.5 px-4"
                >
                  {editingRuleId ? "Save Changes" : "Create Rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT FACT ================= */}
      {isAddingFact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-canvas border border-hairline rounded-[12px] shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <h2 className="text-body-sm-strong text-ink">
                {editingFactId ? `Edit Fact ${editingFactId}` : "Add Approved Fact"}
              </h2>
              <button
                onClick={() => setIsAddingFact(false)}
                className="text-mute hover:text-ink text-[14px]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveFact} className="space-y-4 text-caption">
              <div>
                <label className="block text-caption font-semibold text-body mb-1">
                  Fact Statement *
                </label>
                <textarea
                  rows={2}
                  required
                  value={factStatement}
                  onChange={(e) => setFactStatement(e.target.value)}
                  placeholder="e.g. Inkloom serves 500+ enterprise clients across 12 countries."
                  className="w-full px-3 py-1.5 border border-hairline rounded-[6px] bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-link resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-caption font-semibold text-body mb-1">
                    Exact Value *
                  </label>
                  <input
                    type="text"
                    required
                    value={factValue}
                    onChange={(e) => setFactValue(e.target.value)}
                    placeholder="e.g. 500+"
                    className="w-full px-3 py-1.5 border border-hairline rounded-[6px] bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-link"
                  />
                </div>

                <div>
                  <label className="block text-caption font-semibold text-body mb-1">
                    Entity / Dimension
                  </label>
                  <input
                    type="text"
                    value={factEntity}
                    onChange={(e) => setFactEntity(e.target.value)}
                    placeholder="e.g. client_count"
                    className="w-full px-3 py-1.5 border border-hairline rounded-[6px] bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-link"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-caption font-semibold text-body mb-1">
                    Department Owner
                  </label>
                  <input
                    type="text"
                    value={factOwner}
                    onChange={(e) => setFactOwner(e.target.value)}
                    placeholder="e.g. Sales, Legal, Finance"
                    className="w-full px-3 py-1.5 border border-hairline rounded-[6px] bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-link"
                  />
                </div>

                <div>
                  <label className="block text-caption font-semibold text-body mb-1">
                    Valid From
                  </label>
                  <input
                    type="date"
                    value={factValidFrom}
                    onChange={(e) => setFactValidFrom(e.target.value)}
                    className="w-full px-3 py-1.5 border border-hairline rounded-[6px] bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-link"
                  />
                </div>
              </div>

              <div>
                <label className="block text-caption font-semibold text-body mb-1">
                  Source Reference / Citation
                </label>
                <input
                  type="text"
                  value={factSource}
                  onChange={(e) => setFactSource(e.target.value)}
                  placeholder="e.g. CRM Report Q3 2024, MCA Certificate Filing"
                  className="w-full px-3 py-1.5 border border-hairline rounded-[6px] bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-link"
                />
                <span className="text-[11px] text-mute mt-0.5 block">
                  This reference will be cited verbatim whenever findings reference this fact.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setIsAddingFact(false)}
                  className="btn-pill btn-pill-secondary text-caption !h-auto py-1.5 px-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-pill btn-pill-primary text-caption !h-auto py-1.5 px-4"
                >
                  {editingFactId ? "Save Changes" : "Add Fact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
