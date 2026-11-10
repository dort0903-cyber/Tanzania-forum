import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ThreadCard } from "@/components/forum/thread-card";
import { formatRelativeTime } from "@/lib/utils";
import { BadgeCheck, Calendar, MessageSquare, Flame } from "lucide-react";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
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
      category:categories(id, slug, name_en, name_sw, color),
      author:profiles(id, handle, display_name, avatar_url, is_verified, role)
    `
    )
    .eq("author_id", profile.id)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(20);

  const { count: postCount } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("author_id", profile.id)
    .eq("status", "published");

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-300 text-2xl font-bold shrink-0">
            {(profile.display_name || profile.handle)[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-50">
                {profile.display_name || profile.handle}
              </h1>
              {profile.is_verified && (
                <BadgeCheck className="w-5 h-5 text-brand-600" />
              )}
              {profile.role !== "member" && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300">
                  {profile.role}
                </span>
              )}
            </div>
            <p className="text-stone-500 text-sm mt-0.5">@{profile.handle}</p>
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
                <Flame className="w-4 h-4 text-orange-500" />
                {profile.reputation} reputation
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4" />
                {postCount || 0} posts
              </span>
            </div>
          </div>
        </div>
      </header>

      <section>
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50 mb-4">
          Recent discussions
        </h2>
        <div className="space-y-3">
          {(threads || []).map((thread) => (
            <ThreadCard key={thread.id} thread={thread} />
          ))}
          {(!threads || threads.length === 0) && (
            <p className="text-sm text-stone-500 text-center py-10">
              No public discussions yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
