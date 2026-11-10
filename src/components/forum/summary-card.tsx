"use client";

import { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp, Info } from "lucide-react";

interface SummaryCardProps {
  summary: string;
  generatedAt?: string | null;
}

export function SummaryCard({ summary, generatedAt }: SummaryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isLong = summary.length > 280;
  const displayText = expanded || !isLong ? summary : summary.slice(0, 280) + "…";

  return (
    <div className="rounded-xl border border-violet-200 dark:border-violet-800/50 bg-violet-50/50 dark:bg-violet-950/20 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="text-sm font-semibold text-violet-900 dark:text-violet-100">
              AI Summary — 30-second read
            </h3>
            <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-violet-200/60 dark:bg-violet-800/40 text-violet-700 dark:text-violet-300">
              Groq
            </span>
          </div>
          <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-wrap">
            {displayText}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {isLong && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="inline-flex items-center gap-1 text-xs font-medium text-violet-700 dark:text-violet-300 hover:underline"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" /> Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" /> Show full summary
                  </>
                )}
              </button>
            )}
            <button className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-700 dark:hover:text-stone-300">
              <Info className="w-3.5 h-3.5" />
              How this was generated
            </button>
            {generatedAt && (
              <span className="text-xs text-stone-400">
                Generated {new Date(generatedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
