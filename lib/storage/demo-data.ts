/*
 * Nipuna — Synthetic Demonstration Brand Kit ("Inkloom Corp")
 * Pre-loaded seed data for judges to test every governance feature immediately.
 */

import type { BrandRule, ApprovedFact } from "@/lib/engine/types";

/* ---------- Brand Rules ---------- */

export const DEMO_RULES: BrandRule[] = [
  {
    id: "L-01",
    category: "terminology",
    name: "Brand name capitalisation",
    description: "The brand name must always appear as 'Inkloom', never 'inkLoom', 'INKLOOM', or 'InkLoom'.",
    pattern: "Inkloom",
    prohibitedForms: ["inkLoom", "INKLOOM", "InkLoom", "ink loom", "Ink Loom"],
    replacement: "Inkloom",
    severity: "high",
    version: 3,
    active: true,
    rationale: "Consistent brand capitalisation across all published materials.",
  },
  {
    id: "L-02",
    category: "terminology",
    name: "Deprecated terminology — 'utilize'",
    description: "Replace 'utilize' and its inflected forms with 'use'.",
    pattern: "utilize",
    prohibitedForms: ["utilize", "utilizes", "utilizing", "utilization", "utilised", "utilising"],
    replacement: "use",
    severity: "medium",
    version: 3,
    active: true,
    rationale: "Brand voice guidelines mandate plain language. 'Utilize' is unnecessarily formal.",
  },
  {
    id: "L-03",
    category: "terminology",
    name: "Deprecated terminology — 'leverage'",
    description: "Replace 'leverage' (verb) with 'use' or a more specific verb.",
    pattern: "leverage",
    prohibitedForms: ["leverage", "leverages", "leveraging", "leveraged"],
    replacement: "use",
    severity: "medium",
    version: 2,
    active: true,
    rationale: "Corporate jargon that obscures meaning.",
  },
  {
    id: "T-04",
    category: "terminology",
    name: "Unapproved product terminology",
    description: "The product must be referred to as 'governance platform', not 'AI tool', 'software', or 'app'.",
    pattern: "governance platform",
    prohibitedForms: ["AI tool", "AI-tool", "software", "app", "application", "SaaS tool"],
    replacement: "governance platform",
    severity: "high",
    version: 2,
    active: true,
    rationale: "Consistent product positioning across all external communications.",
  },
  {
    id: "C-01",
    category: "claim",
    name: "Unqualified superlatives and absolutes",
    description: "Claims like '#1', 'best', 'guaranteed', '100%' require approved attribution or must be removed.",
    pattern: "",
    prohibitedForms: [
      "#1", "number one", "best in the market", "best platform",
      "guaranteed results", "guaranteed", "100% foolproof", "100% accurate",
      "unmatched", "unrivaled", "industry-leading",
    ],
    severity: "high",
    version: 1,
    active: true,
    rationale: "Unsubstantiated superlatives create legal and regulatory risk.",
  },
  {
    id: "C-02",
    category: "claim",
    name: "Competitor comparison without attribution",
    description: "Direct competitor comparisons must cite an approved third-party source.",
    pattern: "",
    prohibitedForms: [
      "better than", "faster than", "cheaper than",
      "outperforms", "beats", "surpasses",
    ],
    severity: "high",
    version: 1,
    active: true,
    rationale: "Comparative advertising requires verifiable third-party evidence.",
  },
  {
    id: "TG-01",
    category: "tone",
    name: "Informal/urgent tone mismatch",
    description: "External communications should avoid overly casual or urgency-driven language.",
    pattern: "",
    prohibitedForms: [
      "Hey guys", "Hey there", "You NEED this", "Act now",
      "Don't miss out", "HURRY", "LIMITED TIME", "OMG",
      "!!!", "???", "AMAZING",
    ],
    severity: "medium",
    version: 1,
    active: true,
    rationale: "Brand tone is professional and measured. Avoid hype and urgency tactics.",
  },
  {
    id: "TG-02",
    category: "tone",
    name: "Excessive capitalisation",
    description: "Avoid ALL CAPS words (except acronyms) in external content.",
    pattern: "",
    prohibitedForms: [],
    severity: "low",
    version: 1,
    active: true,
    rationale: "ALL CAPS reads as shouting and undermines professional tone.",
  },
  {
    id: "P-01",
    category: "policy",
    name: "Missing data handling disclosure",
    description: "Content describing data processing must include or reference a privacy disclosure.",
    pattern: "",
    prohibitedForms: [],
    severity: "medium",
    version: 1,
    active: true,
    rationale: "Regulatory compliance requires transparency about data handling.",
  },
  {
    id: "P-02",
    category: "policy",
    name: "Pricing claims require version date",
    description: "Any pricing mentioned must include the effective date or 'as of [date]'.",
    pattern: "",
    prohibitedForms: [],
    severity: "medium",
    version: 1,
    active: true,
    rationale: "Pricing changes frequently. Undated claims become misleading over time.",
  },
];

/* ---------- Approved Facts ---------- */

export const DEMO_FACTS: ApprovedFact[] = [
  {
    id: "F-01",
    statement: "Inkloom was founded in 2023 and is headquartered in Bengaluru, India.",
    value: "2023",
    entity: "founding_year",
    owner: "Legal",
    sourceReference: "Certificate of Incorporation, MCA Filing 2023",
    validFrom: "2023-01-15",
    status: "active",
  },
  {
    id: "F-02",
    statement: "Inkloom holds ISO 27001:2022 and SOC 2 Type II certifications.",
    value: "ISO 27001:2022, SOC 2 Type II",
    entity: "security_certifications",
    owner: "InfoSec",
    sourceReference: "Audit Report, Bureau Veritas, Aug 2024",
    validFrom: "2024-08-01",
    expiry: "2027-08-01",
    status: "active",
  },
  {
    id: "F-03",
    statement: "Inkloom serves 500+ enterprise clients across 12 countries.",
    value: "500+",
    entity: "client_count",
    owner: "Sales",
    sourceReference: "CRM Report Q3 2024",
    validFrom: "2024-09-30",
    status: "active",
  },
  {
    id: "F-04",
    statement: "The Inkloom platform processes 2 million documents per month.",
    value: "2 million",
    entity: "monthly_documents",
    owner: "Engineering",
    sourceReference: "Platform Analytics Dashboard, Oct 2024",
    validFrom: "2024-10-01",
    status: "active",
  },
  {
    id: "F-05",
    statement: "Inkloom's platform uptime SLA is 99.9%.",
    value: "99.9%",
    entity: "uptime_sla",
    owner: "Engineering",
    sourceReference: "Service Level Agreement v4.2",
    validFrom: "2024-01-01",
    status: "active",
  },
  {
    id: "F-06",
    statement: "Inkloom's Series A round raised $8.5 million.",
    value: "$8.5 million",
    entity: "funding_amount",
    owner: "Finance",
    sourceReference: "Press Release, TechCrunch, Mar 2024",
    validFrom: "2024-03-15",
    status: "active",
  },
  {
    id: "F-07",
    statement: "The Inkloom team has 120 employees globally.",
    value: "120",
    entity: "employee_count",
    owner: "HR",
    sourceReference: "HRIS System Export, Sep 2024",
    validFrom: "2024-09-01",
    status: "active",
  },
  {
    id: "F-08",
    statement: "Inkloom's average review turnaround time is under 4 hours.",
    value: "under 4 hours",
    entity: "review_turnaround",
    owner: "Product",
    sourceReference: "Product Analytics Q3 2024",
    validFrom: "2024-09-30",
    status: "active",
  },
];

/* ---------- Preloaded Test Drafts ---------- */

export const DEMO_DRAFTS: { title: string; description: string; content: string }[] = [
  {
    title: "Product Launch Announcement",
    description: "Multi-violation benchmark — contains deprecated terms, conflicting facts, unverified claims, superlatives, and tone issues.",
    content: `Inkloom Product Launch — Q4 2024

Hey guys!! You NEED to check this out — Inkloom is the BEST platform with GUARANTEED results for brand governance.

Our AI tool utilizes advanced algorithms to help enterprises manage their content. Founded in 2019 in Mumbai, Inkloom has been a leader in the content governance space for over a decade.

Trusted by 50,000 customers across India, our software leverages cutting-edge technology to deliver 100% accurate results every single time. We outperforms every competitor in the market.

Don't miss out! Act now and transform your brand management with our AMAZING app. Our industry-leading solution is unmatched in quality and speed.

For pricing, our Enterprise plan starts at $499/month and includes unlimited document reviews with a guaranteed 1-hour turnaround time.`,
  },
  {
    title: "Enterprise Security Briefing",
    description: "Mostly compliant — uses approved facts and proper terminology.",
    content: `Inkloom Enterprise Security Overview

Inkloom maintains rigorous security standards across its governance platform. The platform holds ISO 27001:2022 and SOC 2 Type II certifications, independently audited by Bureau Veritas.

Our infrastructure delivers a 99.9% uptime SLA, backed by redundant cloud deployments across multiple regions. The platform processes 2 million documents per month while maintaining end-to-end encryption for all data in transit and at rest.

Founded in 2023 in Bengaluru, Inkloom serves 500+ enterprise clients across 12 countries. Our team of 120 employees includes dedicated security engineers who conduct regular penetration testing and vulnerability assessments.

All data processing activities are documented in our Privacy Policy and Data Processing Agreement, available on request.`,
  },
  {
    title: "Partner Ecosystem Update",
    description: "Edge cases — borderline claims, regional phrasing, missing attributions.",
    content: `Inkloom Partner Programme — Regional Expansion

Inkloom is rapidly expanding its partner network to cover 25 new markets by end of 2025. Our governance platform integrates seamlessly with leading content management systems.

Early results from our pilot in Southeast Asia show that partners using Inkloom reduced content review cycles by 60%, though this figure is based on a limited sample of 8 partner organisations.

The platform's review turnaround averages under 4 hours for standard documents. Our Series A funding of $8.5 million is being deployed primarily toward partner enablement and regional infrastructure.

We believe Inkloom offers a better value proposition than traditional governance approaches, enabling faster time-to-market for regulated content across financial services, healthcare, and technology sectors.`,
  },
];

/* ---------- Default Brand Kit ---------- */

export const DEMO_BRAND_KIT = {
  id: "bk-inkloom-001",
  name: "Inkloom Corp",
  rules: DEMO_RULES,
  facts: DEMO_FACTS,
};
