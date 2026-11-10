import { createClient } from "@/lib/supabase/server";
import { formatRelativeTime } from "@/lib/utils";

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  const { action } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("audit_logs")
    .select(
      `
      id, action, entity_type, entity_id, metadata, created_at,
      actor:profiles(handle, display_name)
    `
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (action) {
    query = query.ilike("action", `%${action}%`);
  }

  const { data: logs } = await query;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
          Audit logs
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          All significant actions are recorded here.
        </p>
      </div>

      <form className="flex gap-3">
        <input
          name="action"
          defaultValue={action}
          placeholder="Filter by action…"
          className="rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700"
        >
          Filter
        </button>
      </form>

      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/80">
                <th className="text-left px-4 py-3 font-medium text-stone-500">
                  Time
                </th>
                <th className="text-left px-4 py-3 font-medium text-stone-500">
                  Actor
                </th>
                <th className="text-left px-4 py-3 font-medium text-stone-500">
                  Action
                </th>
                <th className="text-left px-4 py-3 font-medium text-stone-500">
                  Entity
                </th>
                <th className="text-left px-4 py-3 font-medium text-stone-500">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {logs && logs.length > 0 ? (
                logs.map((log: any) => (
                  <tr
                    key={log.id}
                    className="hover:bg-stone-50 dark:hover:bg-stone-800/40"
                  >
                    <td className="px-4 py-3 text-xs text-stone-500 whitespace-nowrap">
                      {formatRelativeTime(log.created_at)}
                    </td>
                    <td className="px-4 py-3 text-stone-700 dark:text-stone-300">
                      {log.actor?.display_name || log.actor?.handle || "System"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-500">
                      {log.entity_type}
                      {log.entity_id && (
                        <span className="text-stone-400 ml-1">
                          {String(log.entity_id).slice(0, 8)}…
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-400 max-w-xs truncate">
                      {log.metadata
                        ? JSON.stringify(log.metadata).slice(0, 80)
                        : "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-stone-500"
                  >
                    No log entries yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
