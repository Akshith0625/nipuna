/*
 * Nipuna — Data Service & Persistence Layer
 * Dual-mode persistence:
 * 1. Live Supabase PostgreSQL client (when env vars are present).
 * 2. Local browser-synced Demo Store with pre-loaded "Inkloom Corp" synthetic kit.
 * This guarantees zero setup for judges visiting the live deployment.
 */

import type {
  BrandRule,
  ApprovedFact,
  ReviewComment,
  ReviewEvent,
} from "@/lib/engine/types";
import { DEMO_RULES, DEMO_FACTS } from "./demo-data";
import { createClient } from "@/lib/supabase/client";

const STORAGE_KEYS = {
  RULES: "nipuna_brand_rules_v1",
  FACTS: "nipuna_approved_facts_v1",
  COMMENTS: "nipuna_review_comments_v1",
  EVENTS: "nipuna_audit_events_v1",
  DRAFT: "nipuna_current_draft_v1",
};

export function isSupabaseAvailable(): boolean {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    return Boolean(url && key);
  } catch {
    return false;
  }
}

/* ---------- Brand Rules ---------- */

export function getStoredRules(): BrandRule[] {
  if (typeof window === "undefined") return DEMO_RULES;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RULES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(DEMO_RULES));
      return DEMO_RULES;
    }
    return JSON.parse(raw) as BrandRule[];
  } catch {
    return DEMO_RULES;
  }
}

export function saveStoredRules(rules: BrandRule[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(rules));
  } catch (err) {
    console.error("Failed to persist rules to localStorage", err);
  }
}

/* ---------- Approved Facts ---------- */

export function getStoredFacts(): ApprovedFact[] {
  if (typeof window === "undefined") return DEMO_FACTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FACTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.FACTS, JSON.stringify(DEMO_FACTS));
      return DEMO_FACTS;
    }
    return JSON.parse(raw) as ApprovedFact[];
  } catch {
    return DEMO_FACTS;
  }
}

export function saveStoredFacts(facts: ApprovedFact[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.FACTS, JSON.stringify(facts));
  } catch (err) {
    console.error("Failed to persist facts to localStorage", err);
  }
}

/* ---------- Review Comments ---------- */

export function getStoredComments(): ReviewComment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COMMENTS);
    if (!raw) return [];
    return JSON.parse(raw) as ReviewComment[];
  } catch {
    return [];
  }
}

export function saveStoredComments(comments: ReviewComment[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments));
  } catch (err) {
    console.error("Failed to persist comments to localStorage", err);
  }
}

/* ---------- Audit Events ---------- */

export function getStoredEvents(): ReviewEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EVENTS);
    if (!raw) return [];
    return JSON.parse(raw) as ReviewEvent[];
  } catch {
    return [];
  }
}

export function saveStoredEvents(events: ReviewEvent[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  } catch (err) {
    console.error("Failed to persist events to localStorage", err);
  }
}

/* ---------- Reset to Benchmark ---------- */

export function resetToBenchmark(): {
  rules: BrandRule[];
  facts: ApprovedFact[];
} {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(DEMO_RULES));
    localStorage.setItem(STORAGE_KEYS.FACTS, JSON.stringify(DEMO_FACTS));
    localStorage.removeItem(STORAGE_KEYS.COMMENTS);
    localStorage.removeItem(STORAGE_KEYS.EVENTS);
  }
  return {
    rules: DEMO_RULES,
    facts: DEMO_FACTS,
  };
}

/* ---------- Optional Supabase Remote Sync Helper ---------- */

export async function syncToSupabaseIfConnected(payload: {
  rules?: BrandRule[];
  facts?: ApprovedFact[];
  comment?: ReviewComment;
  event?: ReviewEvent;
}): Promise<boolean> {
  if (!isSupabaseAvailable()) return false;
  try {
    const supabase = createClient();
    if (payload.comment) {
      await supabase.from("review_comments").insert({
        actor: payload.comment.actor,
        role: payload.comment.role,
        version_number: payload.comment.versionNumber,
        text: payload.comment.text,
        created_at: payload.comment.createdAt,
      });
    }
    if (payload.event) {
      await supabase.from("review_events").insert({
        actor: payload.event.actor,
        action: payload.event.action,
        version_number: payload.event.versionNumber,
        comment: payload.event.comment,
        timestamp: payload.event.timestamp,
      });
    }
    return true;
  } catch (e) {
    // Graceful fallback to local store — never fail or interrupt user review
    console.warn("Supabase background sync notice:", e);
    return false;
  }
}
