import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ThreadCard } from "@/components/forum/thread-card";
import { BadgeCheck, Calendar, MessageSquare } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

interface PageProps {
  params: Promise<{ handle: string }>;
}

export default async function ProfilePage({ params }: PageProps) {
  const { handle } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("handle", handle)
    .maybeSingle();

  if (!profile) notFound();

  const { data: threads } = await supabase
    .from("threads")
    .select(
      `
      *,
      category:categories(*),
      author:profiles(id, handle, display_name, avatar_url, is_verified, role)
    `
    )
    .eq("author_id", profile.id)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(20);

  const { count: postCount } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("author_id", profile.id)
    .eq("status", "published");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-300 text-2xl font-bold shrink-0">
            {(profile.display_name || profile.handle)[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50">
                {profile.display_name || profile.handle}
              </h1>
              {profile.is_verified && (
                <BadgeCheck className="w-5 h-5 text-brand-600" />
              )}
              {profile.role === "admin" && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                  Admin
                </span>
              )}
              {profile.role === "moderator" && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                  Moderator
                </span>
              )}
            </div>
            <p className="text-sm text-stone-500 mt-0.5">@{profile.handle}</p>
            {profile.bio && (
              <p className="mt-3 text-sm text-stone-600 dark:text-stone-300">
                {profile.bio}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-stone-500">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Joined {formatRelativeTime(profile.created_at)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4" />
                {postCount ?? 0} posts
              </span>
              <span className="font-medium text-stone-700 dark:text-stone-300">
                {profile.reputation} reputation
              </span>
            </div>
          </div>
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50">
          Threads by {profile.display_name || profile.handle}
        </h2>
        {threads && threads.length > 0 ? (
          threads.map((t) => <ThreadCard key={t.id} thread={t} />)
        ) : (
          <div className="rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 px-6 py-12 text-center text-sm text-stone-500">
            No public threads yet.
          </div>
        )}
      </section>
    </div>
  );
}
