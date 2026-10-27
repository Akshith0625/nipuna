"use client";

import { cn } from "@/lib/utils/cn";

interface NavbarProps {
  brandName: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
  role: "creator" | "reviewer" | "admin";
  onRoleChange: (role: "creator" | "reviewer" | "admin") => void;
}

const TABS = [
  { id: "review", label: "Review" },
  { id: "brandkit", label: "Brand Kit" },
  { id: "insights", label: "Insights" },
];

const ROLES: { id: "creator" | "reviewer" | "admin"; label: string }[] = [
  { id: "creator", label: "Creator" },
  { id: "reviewer", label: "Reviewer" },
  { id: "admin", label: "Admin" },
];

export default function Navbar({
  brandName,
  activeTab,
  onTabChange,
  role,
  onRoleChange,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 flex h-12 items-center justify-between border-b border-border-subtle bg-surface px-4">
      {/* Left — Logo and brand */}
      <div className="flex items-center gap-3">
        <span className="text-[15px] font-semibold tracking-tight text-text-primary">
          nipuna
        </span>
        <span className="text-text-muted">·</span>
        <span className="text-[13px] font-medium text-text-secondary">
          {brandName}
        </span>
      </div>

      {/* Center — Tabs */}
      <nav className="flex items-center gap-0.5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "px-3 py-1.5 text-[13px] font-medium rounded-md transition-base",
              activeTab === tab.id
                ? "bg-accent text-white dark:text-background"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Right — Role switcher */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] uppercase tracking-wider text-text-muted font-medium">
          Demo Mode
        </span>
        <div className="flex items-center border border-border-subtle rounded-md overflow-hidden">
          {ROLES.map((r) => (
            <button
              key={r.id}
              onClick={() => onRoleChange(r.id)}
              className={cn(
                "px-2.5 py-1 text-[12px] font-medium transition-base",
                role === r.id
                  ? "bg-accent text-white dark:text-background"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
