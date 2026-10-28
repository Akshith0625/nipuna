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
    <header className="sticky top-0 z-50 flex h-[52px] items-center justify-between border-b border-hairline bg-canvas px-5">
      {/* Left — Logo and brand */}
      <div className="flex items-center gap-3">
        <span className="text-[15px] font-semibold tracking-[-0.6px] text-ink">
          nipuna
        </span>
        <span className="text-hairline-strong">|</span>
        <span className="text-caption-mono text-body uppercase tracking-wide">
          {brandName}
        </span>
      </div>

      {/* Center — Tabs (pill-style, Vercel tab-ghost pattern) */}
      <nav className="flex items-center gap-1 bg-canvas-soft-2 rounded-[64px] p-[3px]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "px-4 py-[5px] text-body-sm-strong rounded-[64px] transition-base",
              activeTab === tab.id
                ? "bg-canvas text-ink shadow-sm"
                : "text-mute hover:text-body"
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Right — Role switcher */}
      <div className="flex items-center gap-3">
        <span className="text-caption-mono text-mute uppercase tracking-wider">
          Demo Mode
        </span>
        <div className="flex items-center rounded-[6px] border border-hairline overflow-hidden">
          {ROLES.map((r) => (
            <button
              key={r.id}
              onClick={() => onRoleChange(r.id)}
              className={cn(
                "px-2.5 py-[5px] text-body-sm-strong transition-base",
                role === r.id
                  ? "bg-accent text-on-primary"
                  : "text-body hover:text-ink hover:bg-canvas-soft-2"
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
