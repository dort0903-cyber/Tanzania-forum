import { createClient } from "@/lib/supabase/server";
import { UserRoleSelect } from "@/components/admin/user-role-select";
import { formatRelativeTime } from "@/lib/utils";
import { Search } from "lucide-react";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; status?: string }>;
}) {
  const { q, role, status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("profiles")
    .select(
      "id, handle, display_name, role, status, reputation, is_verified, google_email, created_at, last_active_at"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (q) {
    query = query.or(`handle.ilike.%${q}%,display_name.ilike.%${q}%`);
  }
  if (role) query = query.eq("role", role);
  if (status) query = query.eq("status", status);

  const { data: users } = await query;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
          User management
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Search, filter, and manage roles and status.
        </p>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by handle or name…"
            className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
        <select
          name="role"
          defaultValue={role || ""}
          className="rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm"
        >
          <option value="">All roles</option>
          <option value="admin">Admin</option>
          <option value="moderator">Moderator</option>
          <option value="fact_checker">Fact-checker</option>
          <option value="member">Member</option>
        </select>
        <select
          name="status"
          defaultValue={status || ""}
          className="rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700"
        >
          Filter
        </button>
      </form>

      {/* Table */}
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/80">
                <th className="text-left px-4 py-3 font-medium text-stone-500">
                  User
                </th>
                <th className="text-left px-4 py-3 font-medium text-stone-500">
                  Role
                </th>
                <th className="text-left px-4 py-3 font-medium text-stone-500">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-medium text-stone-500">
                  Reputation
                </th>
                <th className="text-left px-4 py-3 font-medium text-stone-500">
                  Joined
                </th>
                <th className="text-left px-4 py-3 font-medium text-stone-500">
                  Email (admin)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {users && users.length > 0 ? (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-stone-50 dark:hover:bg-stone-800/40"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-xs font-semibold text-brand-700 dark:text-brand-300">
                          {(user.display_name || user.handle)[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-stone-900 dark:text-stone-100">
                            {user.display_name || user.handle}
                          </p>
                          <p className="text-xs text-stone-400">@{user.handle}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <UserRoleSelect userId={user.id} currentRole={user.role} />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize ${
                          user.status === "active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                            : user.status === "suspended"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-600 dark:text-stone-300">
                      {user.reputation}
                    </td>
                    <td className="px-4 py-3 text-stone-500 text-xs">
                      {formatRelativeTime(user.created_at)}
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-400 font-mono">
                      {user.google_email
                        ? user.google_email.replace(/(.{2}).+(@.+)/, "$1***$2")
                        : "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-stone-500"
                  >
                    No users found.
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
