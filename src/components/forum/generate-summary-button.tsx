"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  threadId: string;
  title: string;
  language: "en" | "sw";
}

export function GenerateSummaryButton({ threadId, title, language }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, title, language }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate summary");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-dashed border-violet-300 dark:border-violet-700 bg-violet-50/30 dark:bg-violet-950/10 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-violet-500" />
        <div>
          <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
            AI summary available
          </p>
          <p className="text-xs text-stone-500">
            Generate a 30-second overview of this discussion with Groq.
          </p>
        </div>
      </div>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-60 rounded-lg transition-colors shrink-0"
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Sparkles className="w-3.5 h-3.5" />
        )}
        Generate summary
      </button>
      {error && (
        <p className="text-xs text-red-600 w-full sm:w-auto">{error}</p>
      )}
    </div>
  );
}
