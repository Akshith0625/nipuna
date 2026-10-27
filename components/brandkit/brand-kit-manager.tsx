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
  high: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900/50",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900/50",
  low: "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border-stone-200 dark:border-stone-700",
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

  /* ---------- Rule Handlers ---------- */
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

    const prohibitedArray = ruleProhibited
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingRuleId) {
      const existing = rules.find((r) => r.id === editingRuleId);
      if (!existing) return;
      onUpdateRule({
        ...existing,
        name: ruleName.trim(),
        category: ruleCategory,
        severity: ruleSeverity,
        prohibitedForms: prohibitedArray,
        replacement: ruleReplacement.trim() || undefined,
        rationale: ruleRationale.trim(),
        description: ruleDesc.trim(),
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
        category: ruleCategory,
        name: ruleName.trim(),
        description: ruleDesc.trim(),
        pattern: ruleReplacement.trim() || ruleName.trim(),
        prohibitedForms: prohibitedArray,
        replacement: ruleReplacement.trim() || undefined,
        severity: ruleSeverity,
        version: 1,
        active: true,
        rationale: ruleRationale.trim(),
      });
    }

    setIsAddingRule(false);
  }

  /* ---------- Fact Handlers ---------- */
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
        entity: factEntity.trim() || "general_assertion",
        owner: factOwner.trim(),
        sourceReference: factSource.trim() || "Approved Documentation",
        validFrom: factValidFrom,
      });
    } else {
      const newId = `F-0${facts.length + 1}`;
      onAddFact({
        id: newId,
        statement: factStatement.trim(),
        value: factValue.trim(),
        entity: factEntity.trim() || "general_assertion",
        owner: factOwner.trim(),
        sourceReference: factSource.trim() || "Approved Documentation",
        validFrom: factValidFrom,
        status: "active",
      });
    }

    setIsAddingFact(false);
  }

  /* ---------- Export / Import ---------- */
  function handleExportJson() {
    const data = {
      brandName: "Inkloom Corp",
      exportedAt: new Date().toISOString(),
      rules,
      facts,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `brand-kit-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col flex-1 h-full overflow-y-auto bg-surface">
      {/* Top Banner & Header */}
      <div className="border-b border-border-subtle p-6 bg-surface-raised/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-6xl mx-auto w-full">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold">
                Single Source of Truth
              </span>
              <span className="text-text-muted text-[13px]">·</span>
              <span className="text-[13px] text-text-secondary">
                Inkloom Corp Brand Kit
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-text-primary">
              Brand Governance Kit & Facts Registry
            </h1>
            <p className="text-[13px] text-text-secondary mt-1 max-w-2xl">
              Configure deterministic terminology rules, claim boundaries, and verified organizational facts. Every check run by Nipuna strictly adheres to these definitions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJson}
              className="px-3 py-1.5 text-[12px] font-medium border border-border-default rounded-md bg-surface hover:bg-surface-raised text-text-secondary transition-base"
              title="Download full kit as JSON"
            >
              Export JSON
            </button>
            <button
              onClick={onResetToDemo}
              className="px-3 py-1.5 text-[12px] font-medium border border-border-default rounded-md bg-surface hover:bg-surface-raised text-text-muted hover:text-text-primary transition-base"
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
          {/* Sub-tabs */}
          <div className="flex items-center gap-1 bg-surface-raised p-1 rounded-lg border border-border-subtle">
            <button
              onClick={() => {
                setActiveSubTab("rules");
                setCategoryFilter("all");
              }}
              className={cn(
                "px-3.5 py-1.5 text-[13px] font-medium rounded-md transition-base",
                activeSubTab === "rules"
                  ? "bg-surface shadow-xs text-text-primary font-semibold"
                  : "text-text-secondary hover:text-text-primary"
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
                "px-3.5 py-1.5 text-[13px] font-medium rounded-md transition-base",
                activeSubTab === "facts"
                  ? "bg-surface shadow-xs text-text-primary font-semibold"
                  : "text-text-secondary hover:text-text-primary"
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
              className="px-3 py-1.5 text-[13px] border border-border-default rounded-md bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent w-56"
            />

            {canEdit && (
              <button
                onClick={activeSubTab === "rules" ? openAddRule : openAddFact}
                className="px-3 py-1.5 text-[13px] font-medium rounded-md bg-accent text-white dark:text-background hover:bg-accent-hover transition-base flex items-center gap-1.5 shrink-0"
              >
                <span>+</span>
                <span>{activeSubTab === "rules" ? "Add Rule" : "Add Fact"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Pills (for Rules) */}
        {activeSubTab === "rules" && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[12px]">
            <button
              onClick={() => setCategoryFilter("all")}
              className={cn(
                "px-2.5 py-1 rounded-full border transition-base font-medium",
                categoryFilter === "all"
                  ? "bg-accent text-white dark:text-background border-accent"
                  : "border-border-default text-text-secondary hover:bg-surface-raised"
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
                      "px-2.5 py-1 rounded-full border transition-base font-medium",
                      categoryFilter === cat
                        ? "bg-accent text-white dark:text-background border-accent"
                        : "border-border-default text-text-secondary hover:bg-surface-raised"
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
              <div className="py-12 text-center text-text-muted text-[13px]">
                No brand rules found matching your filter.
              </div>
            ) : (
              filteredRules.map((rule) => (
                <div
                  key={rule.id}
                  className={cn(
                    "p-4 rounded-lg border bg-surface transition-base",
                    rule.active
                      ? "border-border-subtle hover:border-border-default"
                      : "border-border-subtle opacity-60 bg-surface-raised/40"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-surface-raised text-text-primary border border-border-subtle">
                          {rule.id}
                        </span>
                        <span className="text-[13px] font-semibold text-text-primary">
                          {rule.name}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border",
                            SEVERITY_BADGES[rule.severity]
                          )}
                        >
                          {rule.severity}
                        </span>
                        <span className="text-[11px] text-text-muted">
                          v{rule.version}
                        </span>
                        <span className="text-text-muted text-[11px]">·</span>
                        <span className="text-[11px] font-medium text-text-secondary">
                          {CATEGORY_LABELS[rule.category]}
                        </span>
                        {!rule.active && (
                          <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-800 text-text-muted font-bold">
                            Disabled
                          </span>
                        )}
                      </div>

                      <p className="text-[13px] text-text-secondary">
                        {rule.description}
                      </p>

                      {/* Prohibited & Replacement */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] pt-1">
                        {rule.prohibitedForms.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-text-muted">Prohibited:</span>
                            <div className="flex flex-wrap gap-1">
                              {rule.prohibitedForms.map((p, i) => (
                                <code
                                  key={i}
                                  className="px-1.5 py-0.2 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 text-[11px] font-mono"
                                >
                                  {p}
                                </code>
                              ))}
                            </div>
                          </div>
                        )}

                        {rule.replacement && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-text-muted">Approved Fix:</span>
                            <code className="px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 text-[11px] font-mono font-medium">
                              {rule.replacement}
                            </code>
                          </div>
                        )}
                      </div>

                      {rule.rationale && (
                        <p className="text-[11px] text-text-muted italic pt-0.5">
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
                            "px-2.5 py-1 text-[11px] font-medium rounded border transition-base",
                            rule.active
                              ? "border-border-default text-text-secondary hover:bg-surface-raised"
                              : "border-emerald-300 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50"
                          )}
                        >
                          {rule.active ? "Disable" : "Enable"}
                        </button>
                        <button
                          onClick={() => openEditRule(rule)}
                          className="px-2.5 py-1 text-[11px] font-medium rounded border border-border-default hover:bg-surface-raised text-text-secondary transition-base"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteRule(rule.id)}
                          className="px-2.5 py-1 text-[11px] font-medium rounded border border-rose-200 text-rose-600 dark:text-rose-400 hover:bg-rose-50 transition-base"
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
            <div className="p-3 bg-stone-50 dark:bg-stone-900 border border-border-subtle rounded-md text-[12px] text-text-secondary">
              <strong>Ground Truth Integrity:</strong> Every claim verified by the Fact Engine is resolved against this registry. Any assertion contradicting these records produces a <code className="text-rose-600 font-mono">conflict</code> verdict; unbacked claims produce a <code className="text-amber-600 font-mono">not_verified</code> verdict.
            </div>

            {filteredFacts.length === 0 ? (
              <div className="py-12 text-center text-text-muted text-[13px]">
                No approved facts found matching your query.
              </div>
            ) : (
              filteredFacts.map((fact) => (
                <div
                  key={fact.id}
                  className="p-4 rounded-lg border border-border-subtle bg-surface hover:border-border-default transition-base space-y-2"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50">
                          {fact.id}
                        </span>
                        <span className="text-[13px] font-semibold text-text-primary">
                          {fact.statement}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[12px] pt-1">
                        <div>
                          <span className="text-text-muted block text-[10px] uppercase font-bold">
                            Exact Value / Entity
                          </span>
                          <span className="font-mono text-[12px] text-text-primary font-medium">
                            {fact.value} ({fact.entity})
                          </span>
                        </div>
                        <div>
                          <span className="text-text-muted block text-[10px] uppercase font-bold">
                            Verified Source Reference
                          </span>
                          <span className="text-[12px] text-text-secondary truncate block">
                            {fact.sourceReference}
                          </span>
                        </div>
                        <div>
                          <span className="text-text-muted block text-[10px] uppercase font-bold">
                            Owner / Validity
                          </span>
                          <span className="text-[12px] text-text-secondary">
                            {fact.owner} · Valid from {fact.validFrom}
                          </span>
                        </div>
                      </div>
                    </div>

                    {canEdit && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => openEditFact(fact)}
                          className="px-2.5 py-1 text-[11px] font-medium rounded border border-border-default hover:bg-surface-raised text-text-secondary transition-base"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteFact(fact.id)}
                          className="px-2.5 py-1 text-[11px] font-medium rounded border border-rose-200 text-rose-600 dark:text-rose-400 hover:bg-rose-50 transition-base"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface border border-border-default rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h2 className="text-[15px] font-bold text-text-primary">
                {editingRuleId ? `Edit Rule ${editingRuleId}` : "Create Brand Rule"}
              </h2>
              <button
                onClick={() => setIsAddingRule(false)}
                className="text-text-muted hover:text-text-primary text-[14px]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-4 text-[13px]">
              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-1">
                  Rule Name *
                </label>
                <input
                  type="text"
                  required
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="e.g. Prohibited competitor comparison"
                  className="w-full px-3 py-1.5 border border-border-default rounded-md bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-text-secondary mb-1">
                    Category
                  </label>
                  <select
                    value={ruleCategory}
                    onChange={(e) =>
                      setRuleCategory(e.target.value as FindingCategory)
                    }
                    className="w-full px-3 py-1.5 border border-border-default rounded-md bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="terminology">Terminology</option>
                    <option value="claim">Claim / Superlative</option>
                    <option value="tone">Tone & Voice</option>
                    <option value="policy">Policy / Compliance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-text-secondary mb-1">
                    Severity
                  </label>
                  <select
                    value={ruleSeverity}
                    onChange={(e) => setRuleSeverity(e.target.value as Severity)}
                    className="w-full px-3 py-1.5 border border-border-default rounded-md bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="high">High (Blocker)</option>
                    <option value="medium">Medium (Warning)</option>
                    <option value="low">Low (Advisory)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-1">
                  Prohibited Forms (comma-separated)
                </label>
                <input
                  type="text"
                  value={ruleProhibited}
                  onChange={(e) => setRuleProhibited(e.target.value)}
                  placeholder="e.g. utilize, utilizes, utilization"
                  className="w-full px-3 py-1.5 border border-border-default rounded-md bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <span className="text-[11px] text-text-muted mt-0.5 block">
                  The engine matches each term with word-boundary and inflection awareness.
                </span>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-1">
                  Intent-Preserving Approved Replacement
                </label>
                <input
                  type="text"
                  value={ruleReplacement}
                  onChange={(e) => setRuleReplacement(e.target.value)}
                  placeholder="e.g. use"
                  className="w-full px-3 py-1.5 border border-border-default rounded-md bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-1">
                  Description & Guidance
                </label>
                <textarea
                  rows={2}
                  value={ruleDesc}
                  onChange={(e) => setRuleDesc(e.target.value)}
                  placeholder="Explain why this rule exists..."
                  className="w-full px-3 py-1.5 border border-border-default rounded-md bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-1">
                  Official Rationale
                </label>
                <input
                  type="text"
                  value={ruleRationale}
                  onChange={(e) => setRuleRationale(e.target.value)}
                  placeholder="e.g. Brand voice guidelines mandate plain language"
                  className="w-full px-3 py-1.5 border border-border-default rounded-md bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setIsAddingRule(false)}
                  className="px-3 py-1.5 text-[13px] font-medium border border-border-default rounded-md hover:bg-surface-raised text-text-secondary transition-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-[13px] font-medium bg-accent text-white dark:text-background rounded-md hover:bg-accent-hover transition-base"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface border border-border-default rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h2 className="text-[15px] font-bold text-text-primary">
                {editingFactId ? `Edit Fact ${editingFactId}` : "Add Approved Fact"}
              </h2>
              <button
                onClick={() => setIsAddingFact(false)}
                className="text-text-muted hover:text-text-primary text-[14px]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveFact} className="space-y-4 text-[13px]">
              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-1">
                  Fact Statement *
                </label>
                <textarea
                  rows={2}
                  required
                  value={factStatement}
                  onChange={(e) => setFactStatement(e.target.value)}
                  placeholder="e.g. Inkloom serves 500+ enterprise clients across 12 countries."
                  className="w-full px-3 py-1.5 border border-border-default rounded-md bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-text-secondary mb-1">
                    Exact Value *
                  </label>
                  <input
                    type="text"
                    required
                    value={factValue}
                    onChange={(e) => setFactValue(e.target.value)}
                    placeholder="e.g. 500+"
                    className="w-full px-3 py-1.5 border border-border-default rounded-md bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-text-secondary mb-1">
                    Entity / Dimension
                  </label>
                  <input
                    type="text"
                    value={factEntity}
                    onChange={(e) => setFactEntity(e.target.value)}
                    placeholder="e.g. client_count"
                    className="w-full px-3 py-1.5 border border-border-default rounded-md bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-text-secondary mb-1">
                    Department Owner
                  </label>
                  <input
                    type="text"
                    value={factOwner}
                    onChange={(e) => setFactOwner(e.target.value)}
                    placeholder="e.g. Sales, Legal, Finance"
                    className="w-full px-3 py-1.5 border border-border-default rounded-md bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-text-secondary mb-1">
                    Valid From
                  </label>
                  <input
                    type="date"
                    value={factValidFrom}
                    onChange={(e) => setFactValidFrom(e.target.value)}
                    className="w-full px-3 py-1.5 border border-border-default rounded-md bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-1">
                  Source Reference / Citation
                </label>
                <input
                  type="text"
                  value={factSource}
                  onChange={(e) => setFactSource(e.target.value)}
                  placeholder="e.g. CRM Report Q3 2024, MCA Certificate Filing"
                  className="w-full px-3 py-1.5 border border-border-default rounded-md bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <span className="text-[11px] text-text-muted mt-0.5 block">
                  This reference will be cited verbatim whenever findings reference this fact.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setIsAddingFact(false)}
                  className="px-3 py-1.5 text-[13px] font-medium border border-border-default rounded-md hover:bg-surface-raised text-text-secondary transition-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-[13px] font-medium bg-accent text-white dark:text-background rounded-md hover:bg-accent-hover transition-base"
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
