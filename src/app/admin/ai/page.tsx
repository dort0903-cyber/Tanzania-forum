import { createClient } from "@/lib/supabase/server";
import { AiSettingsForm } from "@/components/admin/ai-settings-form";
import { Sparkles } from "lucide-react";

export default async function AdminAiPage() {
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", [
      "ai_moderation_enabled",
      "auto_summary_threshold",
      "groq_model",
    ]);

  const map: Record<string, unknown> = {};
  settings?.forEach((s) => {
    map[s.key] = s.value;
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-violet-500" />
          AI / Groq controls
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Configure moderation sensitivity, auto-summary, and model.
        </p>
      </div>

      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6">
        <AiSettingsForm
          initial={{
            ai_moderation_enabled: map.ai_moderation_enabled ?? true,
            auto_summary_threshold: map.auto_summary_threshold ?? 20,
            groq_model: (map.groq_model as string) || "openai/gpt-oss-120b",
          }}
        />
      </div>

      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 space-y-3">
        <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50">
          Current model
        </h2>
        <p className="text-sm text-stone-600 dark:text-stone-300 font-mono">
          {(map.groq_model as string) || "openai/gpt-oss-120b"}
        </p>
        <p className="text-xs text-stone-400">
          API key is loaded from environment variable{" "}
          <code className="bg-stone-100 dark:bg-stone-800 px-1 rounded">
            GROQ_API_KEY
          </code>
          . Never expose it in the client.
        </p>
      </div>
    </div>
  );
}
