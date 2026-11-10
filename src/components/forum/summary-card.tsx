"use client";

import { useState } from "react";
import { Sparkles, X } from "lucide-react";

interface SummaryCardProps {
  summary: string;
  generatedAt?: string | null;
}

export function SummaryCard({ summary, generatedAt }: SummaryCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-violet-200 dark:border-violet-800/60 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors"
      >
        <Sparkles className="w-3.5 h-3.5" />
        AI Summary
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute left-0 top-full mt-2 z-50 w-[min(100vw-2rem,22rem)] sm:w-96 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-lg p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                <span className="text-xs font-semibold text-stone-800 dark:text-stone-100">
                  AI Summary
                </span>
                <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300">
                  Groq
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 rounded-md text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed whitespace-pre-wrap">
              {summary}
            </p>
            {generatedAt && (
              <p className="mt-2 text-[11px] text-stone-400">
                Generated {new Date(generatedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
