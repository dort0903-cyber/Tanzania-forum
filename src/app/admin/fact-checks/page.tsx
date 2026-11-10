import { createClient } from "@/lib/supabase/server";
import { FactCheckForm } from "@/components/admin/fact-check-form";
import { formatRelativeTime } from "@/lib/utils";

export default async function AdminFactChecksPage() {
  const supabase = await createClient();

  const { data: factChecks } = await supabase
    .from("fact_checks")
    .select(
      `
      id, claim, verdict, is_published, published_at, created_at,
      author:profiles(handle, display_name)
    `
    )
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
          JamiiCheck management
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Create and publish fact-checks.
        </p>
      </div>

      <section className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6">
        <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50 mb-4">
          New fact-check
        </h2>
        <FactCheckForm />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50">
          Existing fact-checks
        </h2>
        {factChecks && factChecks.length > 0 ? (
          factChecks.map((fc: any) => (
            <div
              key={fc.id}
              className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 flex flex-wrap items-start justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs font-semibold uppercase px-2 py-0.5 rounded ${
                      fc.verdict === "true"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                        : fc.verdict === "false"
                        ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                    }`}
                  >
                    {fc.verdict}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      fc.is_published
                        ? "bg-green-100 text-green-700"
                        : "bg-stone-100 text-stone-500"
                    }`}
                  >
                    {fc.is_published ? "Published" : "Draft"}
                  </span>
                </div>
                <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                  {fc.claim}
                </p>
                <p className="text-xs text-stone-400 mt-1">
                  by {fc.author?.display_name || fc.author?.handle} ·{" "}
                  {formatRelativeTime(fc.created_at)}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-stone-500 py-8 text-center border border-dashed border-stone-300 dark:border-stone-700 rounded-xl">
            No fact-checks yet.
          </p>
        )}
      </section>
    </div>
  );
}
