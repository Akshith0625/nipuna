"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils/cn";

interface SplashScreenProps {
  onFinish?: () => void;
  onClose?: () => void;
  brandName?: string;
}

export default function SplashScreen({
  onFinish,
  onClose,
  brandName = "Inkloom Corp",
}: SplashScreenProps) {
  const [phase, setPhase] = useState<number>(0);
  const [isDismissing, setIsDismissing] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(true);

  const STEPS = [
    "Grounding facts against Approved Fact Registry...",
    "Compiling terminology & claim constraints...",
    "Activating closed-loop governance engine...",
  ];

  const handleDismiss = () => {
    setIsDismissing(true);
    setTimeout(() => {
      setIsVisible(false);
      onFinish?.();
      onClose?.();
    }, 450);
  };

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 350);
    const t2 = setTimeout(() => setPhase(2), 750);
    const t3 = setTimeout(() => {
      handleDismiss();
    }, 1250);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      onClick={handleDismiss}
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-md text-white transition-opacity duration-300 px-4",
        isDismissing ? "opacity-0 pointer-events-none" : "opacity-100"
      )}
    >
      <div className="relative flex flex-col items-center max-w-sm text-center">
        {/* Glowing Emblem */}
        <div className="relative mb-5 flex items-center justify-center">
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 opacity-40 blur-xl animate-pulse" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-2xl border border-white/25">
            <svg
              className="h-9 w-9 text-white drop-shadow-md"
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
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>Nipuna</span>
          <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
            v2.0
          </span>
        </h1>
        <p className="mt-1 text-xs text-slate-300 font-medium">
          Pre-Publication Brand Governance Platform
        </p>
        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
          Workspace: {brandName}
        </p>

        {/* Progress indicator */}
        <div className="w-56 mt-6">
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-300"
              style={{ width: `${((phase + 1) / STEPS.length) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 font-mono mt-2.5 h-4 transition-all duration-200">
            {STEPS[phase]}
          </p>
        </div>

        <button
          type="button"
          className="mt-6 text-[11px] text-slate-400 hover:text-white underline underline-offset-4 opacity-75 hover:opacity-100 transition-opacity"
        >
          Click anywhere to skip
        </button>
      </div>
    </div>
  );
}
