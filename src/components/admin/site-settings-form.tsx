"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";

interface Props {
  initial: {
    site_name: string;
    tagline: string;
    default_language: string;
  };
}

export function SiteSettingsForm({ initial }: Props) {
  const [siteName, setSiteName] = useState(initial.site_name);
  const [tagline, setTagline] = useState(initial.tagline);
  const [lang, setLang] = useState(initial.default_language);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const updates = [
      { key: "site_name", value: siteName },
      { key: "tagline", value: tagline },
      { key: "default_language", value: lang },
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
        action: "update_site_settings",
        metadata: { siteName, tagline, lang },
      });
    }

    setSaving(false);
    setMessage("Saved.");
    router.refresh();
  };

  return (
    <form onSubmit={save} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Site name</label>
        <input
          value={siteName}
          onChange={(e) => setSiteName(e.target.value)}
          className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Tagline</label>
        <input
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Default language</label>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm"
        >
          <option value="en">English</option>
          <option value="sw">Kiswahili</option>
        </select>
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
          Save
        </button>
        {message && (
          <span className="text-sm text-green-600">{message}</span>
        )}
      </div>
    </form>
  );
}
