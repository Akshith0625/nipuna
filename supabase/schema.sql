-- ==============================================================================
-- Nipuna Brand Governance Platform — PostgreSQL Database Schema
-- Compatible with Supabase PostgreSQL, Row Level Security (RLS), and Realtime
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Organisations / Workspaces
create table if not exists public.organisations (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    slug text unique not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Brand Kit Rules
create table if not exists public.brand_rules (
    id text primary key, -- e.g. 'L-01', 'T-04', 'C-01'
    organisation_id uuid references public.organisations(id) on delete cascade,
    category text not null check (category in ('terminology', 'claim', 'tone', 'policy')),
    name text not null,
    description text not null,
    pattern text not null,
    prohibited_forms text[] default '{}'::text[] not null,
    replacement text,
    severity text not null check (severity in ('high', 'medium', 'low')),
    version integer default 1 not null,
    active boolean default true not null,
    rationale text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Approved Facts Registry (Single Source of Truth)
create table if not exists public.approved_facts (
    id text primary key, -- e.g. 'F-01', 'F-02'
    organisation_id uuid references public.organisations(id) on delete cascade,
    statement text not null,
    value text not null,
    entity text not null,
    owner text not null,
    source_reference text not null,
    valid_from date not null,
    expiry date,
    status text default 'active' not null check (status in ('active', 'deprecated')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Documents Under Governance
create table if not exists public.documents (
    id uuid primary key default uuid_generate_v4(),
    organisation_id uuid references public.organisations(id) on delete cascade,
    title text not null,
    current_version integer default 1 not null,
    review_status text default 'draft' not null check (review_status in ('draft', 'in_review', 'changes_requested', 'approved')),
    created_by text not null default 'creator',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Document Versions
create table if not exists public.document_versions (
    id uuid primary key default uuid_generate_v4(),
    document_id uuid references public.documents(id) on delete cascade not null,
    version_number integer not null,
    content text not null,
    review_status text default 'draft' not null check (review_status in ('draft', 'in_review', 'changes_requested', 'approved')),
    approver text,
    reviewer_notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (document_id, version_number)
);

-- 6. Findings (Scan Results)
create table if not exists public.findings (
    id text primary key,
    version_id uuid references public.document_versions(id) on delete cascade,
    category text not null,
    matched_text text not null,
    span_start integer not null,
    span_end integer not null,
    severity text not null,
    evidence_status text not null,
    rule_id text references public.brand_rules(id) on delete set null,
    source_id text references public.approved_facts(id) on delete set null,
    nearest_source_id text references public.approved_facts(id) on delete set null,
    explanation text not null,
    suggested_fix text,
    intent_rationale text,
    confidence numeric(3, 2) default 1.0 not null,
    decision text default 'pending' not null check (decision in ('pending', 'accepted', 'dismissed')),
    dismissal_reason text check (dismissal_reason in ('contextually_valid', 'exception_granted', 'false_positive', 'rule_outdated')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Review Comments (Creator <-> Reviewer Thread)
create table if not exists public.review_comments (
    id uuid primary key default uuid_generate_v4(),
    document_id uuid references public.documents(id) on delete cascade,
    actor text not null,
    role text not null check (role in ('creator', 'reviewer', 'admin')),
    version_number integer not null default 1,
    finding_id text,
    text text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Audit Events & Workflow Trail
create table if not exists public.review_events (
    id uuid primary key default uuid_generate_v4(),
    document_id uuid references public.documents(id) on delete cascade,
    actor text not null,
    action text not null,
    version_number integer not null default 1,
    comment text,
    timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- Indexes for Performance & Citation Lookups
-- ==============================================================================
create index if not exists idx_brand_rules_category on public.brand_rules(category);
create index if not exists idx_approved_facts_entity on public.approved_facts(entity);
create index if not exists idx_findings_decision on public.findings(decision);
create index if not exists idx_findings_evidence on public.findings(evidence_status);
create index if not exists idx_review_comments_doc on public.review_comments(document_id, version_number);
create index if not exists idx_review_events_doc on public.review_events(document_id);

-- ==============================================================================
-- Row Level Security (RLS) Policies
-- Public access enabled for Demo Mode; restrictable by organisation_id in multi-tenant mode
-- ==============================================================================
alter table public.organisations enable row level security;
alter table public.brand_rules enable row level security;
alter table public.approved_facts enable row level security;
alter table public.documents enable row level security;
alter table public.document_versions enable row level security;
alter table public.findings enable row level security;
alter table public.review_comments enable row level security;
alter table public.review_events enable row level security;

-- Read policies (allow public reads for anonymous demo testing)
create policy "Allow public read access on brand_rules" on public.brand_rules for select using (true);
create policy "Allow public read access on approved_facts" on public.approved_facts for select using (true);
create policy "Allow public read access on documents" on public.documents for select using (true);
create policy "Allow public read access on document_versions" on public.document_versions for select using (true);
create policy "Allow public read access on review_comments" on public.review_comments for select using (true);
create policy "Allow public read access on review_events" on public.review_events for select using (true);

-- Insert/Update policies
create policy "Allow public insert on review_comments" on public.review_comments for insert with check (true);
create policy "Allow public insert on review_events" on public.review_events for insert with check (true);
