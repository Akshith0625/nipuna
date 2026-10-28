# Nipuna (నిపుణ) — Pre-Publication Brand Governance Platform

> **Nipuna** (Sanskrit/Telugu for *expert*, *skilled*, *proficient*) is an explainable, pre-publication brand governance workspace grounded in verified organizational sources. It turns passive brand guidelines and scattered facts into an enforceable review workflow—ensuring content is compliant, accurate, and on-brand before it reaches production.

Built for the **Inkloom AI Brand Governance Challenge (Round 2 Build)**.

---

## 🌟 Key Capabilities

- **Deterministic Rule & Terminology Engine:** Sub-50ms phrase matching with inflected form normalization (e.g., *utilize*, *utilizes*, *utilizing* $\rightarrow$ *use*), case preservation, and whole-word boundary enforcement.
- **Evidence-Linked Fact Verification:** 3-state verdict engine (`supported`, `conflict`, `not_verified`) strictly correlated against an active Approved Fact Registry. Never hallucinates sources—every cited source ID is cross-referenced against verified records.
- **Intent-Preserving Reversible Corrections:** Context-aware suggested replacements that preserve the creator's communicative purpose, complete with character diffs, 1-click in-place application, and full undo history.
- **Interactive Editorial Workbench:** Dual-mode editor (`Live Edit` and `Highlights View`), client-side Word document (`.docx`) upload via Mammoth, and bidirectional highlight-to-card focus synchronization.
- **Two-Tier Findings Filter:** Cleanly structured filter bar with Category filters on Tier 1 and Status filters on Tier 2 (`All Statuses` strictly preceding `Actionable`, `Fact Conflict`, `Unbacked Claim`, `Rule Match`).
- **Guideline-Health Insights Dashboard:** Aggregates dismissal reasons (`contextually_valid`, `exception_granted`, `false_positive`, `rule_outdated`) and automatically triggers *"Clarification Needed"* alerts for rules with $>30\%$ creator dismissals.
- **Human-in-the-Loop Review Queue:** Role-based views (`Creator`, `Reviewer`, `Admin`), side-by-side diff comparison, version approvals, and document locking.
- **Brand Kit & Facts Registry Manager:** Full interactive CRUD for brand rules and approved facts with 1-click JSON backup import and export.

---

## 🏗️ Architecture & Code Map

```
nipuna/
├── app/
│   ├── layout.tsx                # Global HTML shell, fonts (Geist), metadata, and favicon
│   ├── page.tsx                  # Main review workbench orchestrating editor, drawer & tabs
│   ├── globals.css               # Design tokens, semantic colors, and smooth micro-animations
│   └── icon.svg                  # Brand geometric SVG mark
├── components/
│   ├── brandkit/
│   │   └── brand-kit-manager.tsx # Brand rules & approved facts CRUD with JSON import/export
│   ├── editor/
│   │   ├── draft-workspace.tsx   # Live editor, .docx upload, benchmarks, and highlight spans
│   │   ├── findings-panel.tsx    # Filterable drawer, 1-click accept/undo, dismissal modal
│   │   └── diff-viewer.tsx       # Character and word diff comparison (Diff-Match-Patch)
│   ├── insights/
│   │   └── guideline-health-dashboard.tsx # KPI metrics, contested rules, and clarification alerts
│   ├── layout/
│   │   ├── navbar.tsx            # Wordmark lockup, tab navigation, and role switcher
│   │   └── splash-screen.tsx     # Startup telemetry & grounding splash animation
│   └── review/
│       └── review-panel.tsx      # Version approvals, audit events, and threaded review notes
├── lib/
│   ├── engine/
│   │   ├── orchestrator.ts       # Check pipeline, span deduplication, and risk scoring
│   │   ├── rules.ts              # Deterministic phrase matching & tone heuristics
│   │   ├── facts.ts              # 3-verdict evidence correlation engine & claim extractor
│   │   └── types.ts              # Core TypeScript contracts (Findings, Rules, Facts)
│   ├── storage/
│   │   ├── data-service.ts       # Unified persistence adapter (Demo Store + Supabase sync)
│   │   └── demo-data.ts          # Preloaded "Inkloom Corp" synthetic brand kit & benchmarks
│   ├── supabase/
│   │   └── client.ts             # Browser Supabase client (@supabase/ssr)
│   └── utils/
│       └── cn.ts                 # ClassName merging utility (clsx + tailwind-merge)
├── scripts/
│   └── test-supabase.mjs         # Standalone Supabase connectivity verification script
└── supabase/
    └── schema.sql                # Production PostgreSQL schema with Row-Level Security
```

---

## ⚡ Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **UI & State:** React 19, TypeScript 5 (Strict Mode)
- **Styling:** Tailwind CSS v4, Lucide React (1.75 stroke width)
- **Document Ingestion:** Mammoth.js (client-safe Word `.docx` parsing)
- **Diff Computation:** Diff-Match-Patch
- **Persistence Layer:** Dual-Mode (localStorage/in-memory demo store for friction-free judge evaluation + optional Supabase PostgreSQL sync)

---

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/Akshith0625/nipuna.git
cd nipuna
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. The application boots instantly with pre-loaded synthetic demonstration data for **Inkloom Corp**.

### 3. (Optional) Configure Supabase
If you wish to test live database synchronization, add your credentials to `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```
Verify the connection using the test script:
```bash
node scripts/test-supabase.mjs
```

---

## 🧪 Quality & Verification Checks

```bash
# Type check (strict TypeScript)
npx tsc --noEmit

# Lint check (zero warnings or errors)
npx eslint app components lib

# Production bundle build
npm run build
```

---

## 📝 License
Built for the Inkloom AI Brand Governance Challenge. All rights reserved.
