"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

interface NavbarProps {
  brandName: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
  role: "creator" | "reviewer" | "admin";
  onRoleChange: (role: "creator" | "reviewer" | "admin") => void;
  onShowSplash?: () => void;
}

const TABS = [
  { id: "review", label: "Review Workbench", shortLabel: "Review", icon: "📝" },
  { id: "brandkit", label: "Brand Kit & Facts", shortLabel: "Brand Kit", icon: "🛡️" },
  { id: "insights", label: "Guideline Health", shortLabel: "Insights", icon: "📊" },
];

const ROLES: { id: "creator" | "reviewer" | "admin"; label: string; badge: string }[] = [
  { id: "creator", label: "Creator", badge: "Edit & Submit" },
  { id: "reviewer", label: "Reviewer", badge: "Approve & Feedback" },
  { id: "admin", label: "Admin", badge: "Manage Policies" },
];

export default function Navbar({
  brandName,
  activeTab,
  onTabChange,
  role,
  onRoleChange,
  onShowSplash,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-3 sm:px-6 shadow-xs">
      {/* Left: Brand Logo & Title */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onShowSplash}
          className="group flex items-center gap-2.5 focus:outline-none"
          title="Click to replay Nipuna intro"
        >
          {/* Nipuna Brand Icon */}
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 shadow-sm shadow-indigo-500/25 border border-indigo-400/30 transition-transform group-hover:scale-105">
            <svg
              className="h-4.5 w-4.5 text-white"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 23V9L18 20V9H22V23L12 12V23H8Z"
                fill="currentColor"
              />
              <circle cx="24" cy="8" r="3.5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
            </svg>
          </div>

          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-[16px] font-bold tracking-tight text-slate-900 leading-none">
                Nipuna
              </span>
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/60 hidden sm:inline-block">
                Governance
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium hidden sm:inline leading-tight">
              {brandName}
            </span>
          </div>
        </button>
      </div>

      {/* Center: Tabs with rich active indicators */}
      <nav className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-full border border-slate-200/80 shadow-xs">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "px-3 sm:px-4 py-1.5 text-xs sm:text-[13px] font-semibold rounded-full transition-all duration-150 flex items-center gap-1.5",
                isActive
                  ? "bg-white text-indigo-700 shadow-sm border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              )}
            >
              <span className="text-[12px] hidden md:inline">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
            </button>
          );
        })}
      </nav>

      {/* Right: Role Switcher & Mobile Menu */}
      <div className="flex items-center gap-2">
        {/* Role Switcher */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10.5px] font-mono uppercase tracking-wider text-slate-400 font-semibold hidden lg:inline">
            Role:
          </span>
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
            {ROLES.map((r) => {
              const isCurrent = role === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => onRoleChange(r.id)}
                  title={`${r.label}: ${r.badge}`}
                  className={cn(
                    "px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-semibold rounded-md transition-all duration-150",
                    isCurrent
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                  )}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
