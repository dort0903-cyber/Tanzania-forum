import { createClient } from "@/lib/supabase/server";
import { SiteSettingsForm } from "@/components/admin/site-settings-form";

export default async function AdminSettingsPage() {
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from("site_settings")
    .select("key, value");

  const map: Record<string, unknown> = {};
  settings?.forEach((s) => {
    map[s.key] = s.value;
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
          Site settings
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Identity, defaults, and platform configuration.
        </p>
      </div>

      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6">
        <SiteSettingsForm
          initial={{
            site_name: String(map.site_name ?? "Tanzania Forums").replace(
              /^"|"$/g,
              ""
            ),
            tagline: String(
              map.tagline ??
                "Tanzania's open forum for ideas, truth, and community."
            ).replace(/^"|"$/g, ""),
            default_language: String(map.default_language ?? "en").replace(
              /^"|"$/g,
              ""
            ),
          }}
        />
      </div>

      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 space-y-2">
        <h2 className="text-sm font-semibold">Security notes</h2>
        <ul className="text-xs text-stone-500 space-y-1 list-disc list-inside">
          <li>Admin access is enforced by middleware + role check.</li>
          <li>Google OAuth is the only sign-in method.</li>
          <li>API keys (Groq) live in environment variables only.</li>
          <li>Audit log records sensitive admin actions.</li>
          <li>
            First Google account that signs in becomes the bootstrap admin.
          </li>
        </ul>
      </div>
    </div>
  );
}
