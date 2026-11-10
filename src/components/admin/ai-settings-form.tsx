"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";

interface Props {
  initial: {
    ai_moderation_enabled: boolean | unknown;
    auto_summary_threshold: number | unknown;
    groq_model: string;
  };
}

export function AiSettingsForm({ initial }: Props) {
  const [moderation, setModeration] = useState(
    Boolean(initial.ai_moderation_enabled)
  );
  const [threshold, setThreshold] = useState(
    Number(initial.auto_summary_threshold) || 20
  );
  const [model, setModel] = useState(initial.groq_model);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const updates = [
      { key: "ai_moderation_enabled", value: moderation },
      { key: "auto_summary_threshold", value: threshold },
      { key: "groq_model", value: model },
    ];

    for (const u of updates) {
      await supabase.from("site_settings").upsert({
        key: u.key,
        value: u.value,
        updated_at: new Date().toISOString(),
      });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("audit_logs").insert({
        actor_id: user.id,
        action: "update_ai_settings",
        metadata: { moderation, threshold, model },
      });
    }

    setSaving(false);
    setMessage("Settings saved.");
    router.refresh();
  };

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-stone-900 dark:text-stone-100">
            AI moderation
          </label>
          <p className="text-xs text-stone-500">
            Automatically flag potentially harmful content.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModeration(!moderation)}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            moderation ? "bg-brand-600" : "bg-stone-300 dark:bg-stone-600"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
              moderation ? "translate-x-5" : ""
            }`}
          />
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-900 dark:text-stone-100 mb-1.5">
          Auto-summary threshold (replies)
        </label>
        <input
          type="number"
          min={5}
          max={100}
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="w-32 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
        <p className="text-xs text-stone-500 mt-1">
          Suggest generating a summary after this many replies.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-900 dark:text-stone-100 mb-1.5">
          Groq model
        </label>
        <input
          type="text"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-lg"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save settings
        </button>
        {message && (
          <span className="text-sm text-green-600 dark:text-green-400">
            {message}
          </span>
        )}
      </div>
    </form>
  );
}
