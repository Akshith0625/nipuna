"use client";

import { FileText, Shield, BarChart3 } from "lucide-react";
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
  { id: "review", label: "Review Workbench", shortLabel: "Review", icon: FileText },
  { id: "brandkit", label: "Brand Kit & Facts", shortLabel: "Brand Kit", icon: Shield },
  { id: "insights", label: "Guideline Health", shortLabel: "Insights", icon: BarChart3 },
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
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-3 sm:px-6 shadow-xs">
      {/* Left: Brand Logo & Title (Clean Wordmark + Geometric Mark) */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onShowSplash}
          className="group flex items-center gap-2.5 focus:outline-none text-left"
          title="Click to replay Nipuna intro"
        >
          {/* Modern Geometric Lettermark (No heavy circular avatar) */}
          <div className="flex h-7 w-7 items-center justify-center transition-transform group-hover:scale-105">
            <svg
              className="h-6 w-6 text-indigo-600 dark:text-indigo-400"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Clean stylized geometric N mark */}
              <path
                d="M5 23V5L17.5 19.5V5H22V23L9.5 8.5V23H5Z"
                fill="currentColor"
              />
              <circle cx="23.5" cy="5" r="2.5" className="fill-emerald-500" />
            </svg>
          </div>

          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white leading-none">
                Nipuna
              </span>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs px-2 py-0.5 rounded-md font-medium leading-none hidden sm:inline-block border border-slate-200/60">
                Governance
              </span>
            </div>
            <span className="text-xs text-slate-500 font-medium leading-tight mt-0.5 hidden sm:inline">
              {brandName}
            </span>
          </div>
        </button>
      </div>

      {/* Center: Tabs with Monochromatic Stroke SVG Icons */}
      <nav className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-full border border-slate-200/80 shadow-xs">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "px-3 sm:px-4 py-1.5 text-xs sm:text-[13px] font-semibold rounded-full transition-all duration-150 inline-flex items-center gap-1.5",
                isActive
                  ? "bg-white text-indigo-700 shadow-sm border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 transition-colors",
                  isActive ? "text-indigo-600" : "text-slate-500"
                )}
                strokeWidth={1.75}
              />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
            </button>
          );
        })}
      </nav>

      {/* Right: Role Switcher Aligned to Baseline */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold hidden lg:inline">
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
