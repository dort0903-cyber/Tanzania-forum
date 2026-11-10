import { createClient } from "@/lib/supabase/server";
import {
  Users,
  MessageSquare,
  Flag,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [
    { count: totalUsers },
    { count: totalThreads },
    { count: totalPosts },
    { count: openReports },
    { count: publishedFactChecks },
    { count: flaggedPosts },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("threads").select("*", { count: "exact", head: true }),
    supabase.from("posts").select("*", { count: "exact", head: true }),
    supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "open"),
    supabase
      .from("fact_checks")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true),
    supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("is_ai_flagged", true),
  ]);

  // Recent activity
  const { data: recentThreads } = await supabase
    .from("threads")
    .select("id, title, slug, created_at, reply_count")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: recentUsers } = await supabase
    .from("profiles")
    .select("id, handle, display_name, role, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const kpis = [
    {
      label: "Total users",
      value: totalUsers ?? 0,
      icon: Users,
      href: "/admin/users",
      color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40",
    },
    {
      label: "Threads",
      value: totalThreads ?? 0,
      icon: MessageSquare,
      href: "/admin/categories",
      color: "text-brand-600 bg-brand-50 dark:bg-brand-950/40",
    },
    {
      label: "Posts",
      value: totalPosts ?? 0,
      icon: TrendingUp,
      href: "#",
      color: "text-violet-600 bg-violet-50 dark:bg-violet-950/40",
    },
    {
      label: "Open reports",
      value: openReports ?? 0,
      icon: Flag,
      href: "/admin/moderation",
      color: "text-red-600 bg-red-50 dark:bg-red-950/40",
    },
    {
      label: "AI flagged",
      value: flaggedPosts ?? 0,
      icon: Sparkles,
      href: "/admin/moderation",
      color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40",
    },
    {
      label: "Fact-checks",
      value: publishedFactChecks ?? 0,
      icon: ShieldCheck,
      href: "/admin/fact-checks",
      color: "text-green-600 bg-green-50 dark:bg-green-950/40",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
          Dashboard
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Overview of Tanzania Forums activity and health.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Link
              key={kpi.label}
              href={kpi.href}
              className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 hover:border-brand-300 dark:hover:border-brand-700 transition-colors"
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${kpi.color}`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold text-stone-900 dark:text-stone-50">
                {kpi.value}
              </p>
              <p className="text-xs text-stone-500 mt-0.5">{kpi.label}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent threads */}
        <section className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5">
          <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50 mb-4">
            Recent threads
          </h2>
          <ul className="space-y-3">
            {recentThreads && recentThreads.length > 0 ? (
              recentThreads.map((t) => (
                <li key={t.id} className="flex items-start justify-between gap-3">
                  <Link
                    href={`/t/${t.slug}`}
                    className="text-sm font-medium text-stone-800 dark:text-stone-200 hover:text-brand-600 line-clamp-1"
                  >
                    {t.title}
                  </Link>
                  <span className="text-xs text-stone-400 shrink-0">
                    {t.reply_count} replies
                  </span>
                </li>
              ))
            ) : (
              <p className="text-sm text-stone-500">No threads yet.</p>
            )}
          </ul>
        </section>

        {/* Recent users */}
        <section className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5">
          <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50 mb-4">
            New sign-ins
          </h2>
          <ul className="space-y-3">
            {recentUsers && recentUsers.length > 0 ? (
              recentUsers.map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-xs font-semibold text-brand-700 dark:text-brand-300">
                      {(u.display_name || u.handle)[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate">
                      {u.display_name || u.handle}
                    </span>
                  </div>
                  <span className="text-xs capitalize px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-500">
                    {u.role}
                  </span>
                </li>
              ))
            ) : (
              <p className="text-sm text-stone-500">No users yet.</p>
            )}
          </ul>
        </section>
      </div>

      {/* Quick actions */}
      <section className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5">
        <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50 mb-4">
          Quick actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/moderation"
            className="px-4 py-2 text-sm font-medium bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/50"
          >
            Review flagged content
          </Link>
          <Link
            href="/admin/fact-checks"
            className="px-4 py-2 text-sm font-medium bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-950/50"
          >
            Publish fact-check
          </Link>
          <Link
            href="/admin/announcements"
            className="px-4 py-2 text-sm font-medium bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-950/50"
          >
            Broadcast announcement
          </Link>
          <Link
            href="/admin/ai"
            className="px-4 py-2 text-sm font-medium bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-950/50"
          >
            AI settings
          </Link>
        </div>
      </section>
    </div>
  );
}
