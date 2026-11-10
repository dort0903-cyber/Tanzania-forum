import { createClient } from "@/lib/supabase/server";
import { ThreadCard } from "@/components/forum/thread-card";
import { CategoryCard } from "@/components/forum/category-card";
import { Flame, MessageSquare, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";

export default async function HomePage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  const { data: latestThreads } = await supabase
    .from("threads")
    .select(
      `
      *,
      category:categories(*),
      author:profiles(id, handle, display_name, avatar_url, is_verified, role)
    `
    )
    .eq("status", "published")
    .order("last_activity_at", { ascending: false })
    .limit(8);

  const { data: trendingThreads } = await supabase
    .from("threads")
    .select(
      `
      *,
      category:categories(*),
      author:profiles(id, handle, display_name, avatar_url, is_verified, role)
    `
    )
    .eq("status", "published")
    .order("reply_count", { ascending: false })
    .limit(5);

  const { data: topContributors } = await supabase
    .from("profiles")
    .select("id, handle, display_name, avatar_url, reputation, is_verified, role")
    .eq("status", "active")
    .order("reputation", { ascending: false })
    .limit(6);

  const { data: factChecks } = await supabase
    .from("fact_checks")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(3);

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 px-6 py-12 sm:px-10 sm:py-16 text-white">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance">
            Tanzania’s open forum for ideas, truth, and community.
          </h1>
          <p className="mt-4 text-brand-100 text-lg leading-relaxed">
            Join conversations that matter — from Siasa to Tech, relationships to
            fact-checking. Read freely. 
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/c/siasa"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-brand-800 font-semibold rounded-xl hover:bg-brand-50 transition-colors"
            >
              Explore discussions
            </Link>
            <Link
              href="/c/tzcheck"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-800/40 text-white font-medium rounded-xl border border-white/20 hover:bg-brand-800/60 transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              TzCheck
            </Link>
          </div>
        </div>
        <div className="absolute -right-20 -top-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl" />
      </section>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50 flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              Trending
            </h2>
            <Link
              href="/trending"
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {trendingThreads && trendingThreads.length > 0 ? (
              trendingThreads.map((thread) => (
                <ThreadCard key={thread.id} thread={thread} />
              ))
            ) : (
              <EmptyState
                icon={MessageSquare}
                title="No discussions yet"
                description="Be the first to start a conversation."
              />
            )}
          </div>
        </section>

        <div className="lg:col-span-5 space-y-6">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
              Categories
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {categories?.map((cat) => (
                <CategoryCard key={cat.id} category={cat} />
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5">
            <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50 flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-brand-600" />
              Top contributors
            </h2>
            <div className="space-y-3">
              {topContributors && topContributors.length > 0 ? (
                topContributors.map((user, i) => (
                  <Link
                    key={user.id}
                    href={`/u/${user.handle}`}
                    className="flex items-center gap-3 group"
                  >
                    <span className="text-xs font-medium text-stone-400 w-4">
                      {i + 1}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-300 text-sm font-semibold">
                      {(user.display_name || user.handle)[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800 dark:text-stone-100 truncate group-hover:text-brand-600">
                        {user.display_name || user.handle}
                      </p>
                      <p className="text-xs text-stone-500">
                        {user.reputation} reputation
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-stone-500">No contributors yet.</p>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Latest */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-brand-600" />
            Latest discussions
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {latestThreads && latestThreads.length > 0 ? (
            latestThreads.map((thread) => (
              <ThreadCard key={thread.id} thread={thread} />
            ))
          ) : (
            <div className="md:col-span-2">
              <EmptyState
                icon={MessageSquare}
                title="The forum is quiet"
                description="Start the first discussion and set the tone for the community."
              />
            </div>
          )}
        </div>
      </section>

      {/* TzCheck */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            TzCheck
          </h2>
          <Link
            href="/c/tzcheck"
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            All fact-checks
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {factChecks && factChecks.length > 0 ? (
            factChecks.map((fc) => (
              <div
                key={fc.id}
                className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4"
              >
                <span
                  className={`inline-block text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md mb-2 ${
                    fc.verdict === "true"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                      : fc.verdict === "false"
                      ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                  }`}
                >
                  {fc.verdict}
                </span>
                <p className="text-sm font-medium text-stone-900 dark:text-stone-100 line-clamp-2">
                  {fc.claim}
                </p>
              </div>
            ))
          ) : (
            <div className="md:col-span-3">
              <EmptyState
                icon={ShieldCheck}
                title="No fact-checks published yet"
                description="TzCheck will appear here once fact-checkers publish claims."
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/50 px-6 py-12 text-center">
      <Icon className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
      <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300">
        {title}
      </h3>
      <p className="mt-1 text-sm text-stone-500">{description}</p>
    </div>
  );
}
