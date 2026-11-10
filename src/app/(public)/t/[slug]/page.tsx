import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { SummaryCard } from "@/components/forum/summary-card";
import { PostItem } from "@/components/forum/post-item";
import { ReplyComposer } from "@/components/forum/reply-composer";
import { GenerateSummaryButton } from "@/components/forum/generate-summary-button";
import { formatRelativeTime } from "@/lib/utils";
import {
  BadgeCheck,
  MessageSquare,
  Eye,
  Share2,
  Bookmark,
  Flag,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { ThreadActions } from "@/components/forum/thread-actions";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ThreadPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: thread } = await supabase
    .from("threads")
    .select(
      `
      *,
      category:categories(*),
      author:profiles(id, handle, display_name, avatar_url, is_verified, role)
    `
    )
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!thread) notFound();

  // Increment view count (fire and forget)
  supabase
    .from("threads")
    .update({ view_count: (thread.view_count || 0) + 1 })
    .eq("id", thread.id)
    .then(() => {});

  const { data: posts } = await supabase
    .from("posts")
    .select(
      `
      *,
      author:profiles(id, handle, display_name, avatar_url, is_verified, role)
    `
    )
    .eq("thread_id", thread.id)
    .eq("status", "published")
    .order("created_at", { ascending: true });

  // Related threads
  const { data: related } = await supabase
    .from("threads")
    .select("id, title, slug, reply_count, last_activity_at")
    .eq("category_id", thread.category_id)
    .eq("status", "published")
    .neq("id", thread.id)
    .order("last_activity_at", { ascending: false })
    .limit(5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Main content */}
      <div className="lg:col-span-8 space-y-6">
        {/* Thread header */}
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {thread.category && (
              <Link
                href={`/c/${thread.category.slug}`}
                className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium"
                style={{
                  backgroundColor: `${thread.category.color}18`,
                  color: thread.category.color,
                }}
              >
                {thread.category.name_en}
              </Link>
            )}
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-stone-100 dark:bg-stone-800 text-stone-500">
              {thread.language}
            </span>
            {thread.is_locked && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                <Lock className="w-3 h-3" /> Locked
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-50 tracking-tight text-balance">
            {thread.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-stone-500">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-300 text-xs font-semibold">
                {(thread.author?.display_name || thread.author?.handle || "A")[0].toUpperCase()}
              </div>
              <span className="font-medium text-stone-700 dark:text-stone-300">
                {thread.author?.display_name || thread.author?.handle}
              </span>
              {thread.author?.is_verified && (
                <BadgeCheck className="w-4 h-4 text-brand-600" />
              )}
            </div>
            <span>·</span>
            <time>{formatRelativeTime(thread.created_at)}</time>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              {thread.reply_count} replies
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {thread.view_count} views
            </span>
          </div>

          <ThreadActions threadId={thread.id} title={thread.title} slug={thread.slug} />
        </header>

        {/* AI Summary */}
        {thread.ai_summary ? (
          <SummaryCard
            summary={thread.ai_summary}
            generatedAt={thread.ai_summary_generated_at}
          />
        ) : (
          thread.reply_count >= 3 && (
            <GenerateSummaryButton
              threadId={thread.id}
              title={thread.title}
              language={thread.language}
            />
          )
        )}

        {/* Posts */}
        <section className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 divide-y divide-stone-100 dark:divide-stone-800">
          {posts && posts.length > 0 ? (
            posts.map((post) => (
              <div key={post.id} className="px-4 sm:px-5">
                <PostItem post={post} threadId={thread.id} />
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center text-sm text-stone-500">
              No replies yet. Be the first to respond.
            </div>
          )}
        </section>

        {/* Reply box */}
        <section>
          <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50 mb-3">
            Continue the discussion
          </h2>
          <ReplyComposer
            threadId={thread.id}
            isLocked={thread.is_locked}
            placeholder="Share your thoughts…"
          />
        </section>
      </div>

      {/* Sidebar */}
      <aside className="lg:col-span-4 space-y-6">
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sticky top-28">
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50 mb-4">
            Thread stats
          </h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-stone-500">Replies</dt>
              <dd className="font-medium text-stone-800 dark:text-stone-200">
                {thread.reply_count}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">Views</dt>
              <dd className="font-medium text-stone-800 dark:text-stone-200">
                {thread.view_count}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">Language</dt>
              <dd className="font-medium text-stone-800 dark:text-stone-200 uppercase">
                {thread.language}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">Created</dt>
              <dd className="font-medium text-stone-800 dark:text-stone-200">
                {new Date(thread.created_at).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>

        {related && related.length > 0 && (
          <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50 mb-4">
              Related threads
            </h3>
            <ul className="space-y-3">
              {related.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/t/${r.slug}`}
                    className="block text-sm font-medium text-stone-800 dark:text-stone-200 hover:text-brand-600 dark:hover:text-brand-400 line-clamp-2"
                  >
                    {r.title}
                  </Link>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {r.reply_count} replies · {formatRelativeTime(r.last_activity_at)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}
