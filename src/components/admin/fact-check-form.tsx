"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import type { VerdictType } from "@/types/database";

const VERDICTS: VerdictType[] = [
  "true",
  "false",
  "misleading",
  "unverified",
  "satire",
];

export function FactCheckForm() {
  const [claim, setClaim] = useState("");
  const [verdict, setVerdict] = useState<VerdictType>("unverified");
  const [explanation, setExplanation] = useState("");
  const [publish, setPublish] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claim.trim() || !explanation.trim()) return;

    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("fact_checks").insert({
      claim: claim.trim(),
      verdict,
      explanation_en: explanation.trim(),
      author_id: user.id,
      is_published: publish,
      published_at: publish ? new Date().toISOString() : null,
      sources: [],
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    await supabase.from("audit_logs").insert({
      actor_id: user.id,
      action: "create_fact_check",
      metadata: { verdict, published: publish },
    });

    setClaim("");
    setExplanation("");
    setVerdict("unverified");
    setLoading(false);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
          Claim
        </label>
        <input
          value={claim}
          onChange={(e) => setClaim(e.target.value)}
          required
          placeholder="The claim being checked…"
          className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
          Verdict
        </label>
        <div className="flex flex-wrap gap-2">
          {VERDICTS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVerdict(v)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize ${
                verdict === v
                  ? "bg-brand-600 text-white"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
          Explanation (English)
        </label>
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          required
          rows={4}
          placeholder="Evidence and reasoning…"
          className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 resize-y"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300">
        <input
          type="checkbox"
          checked={publish}
          onChange={(e) => setPublish(e.target.checked)}
          className="rounded border-stone-300"
        />
        Publish immediately
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-lg"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        Save fact-check
      </button>
    </form>
  );
}
