import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PostItem } from "@/components/forum/post-item";
import { ReplyComposer } from "@/components/forum/reply-composer";
import { SummaryCard } from "@/components/forum/summary-card";
import { GenerateSummaryButton } from "@/components/forum/generate-summary-button";
import { ThreadActions } from "@/components/forum/thread-actions";
import { ViewCounter } from "@/components/forum/view-counter";
import { formatRelativeTime } from "@/lib/utils";
import { BadgeCheck, Eye, MessageSquare } from "lucide-react";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: thread } = await supabase
    .from("threads")
    .select(
      `
      *,
      category:categories(id, slug, name_en, name_sw, color),
      author:profiles(id, handle, display_name, avatar_url, is_verified, role)
    `
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!thread) notFound();

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

  const { data: related } = await supabase
    .from("threads")
    .select("id, title, slug, reply_count, last_activity_at")
    .eq("category_id", thread.category_id)
    .eq("status", "published")
    .neq("id", thread.id)
    .order("last_activity_at", { ascending: false })
    .limit(5);

  const rootPosts = (posts || []).filter((p) => !p.parent_id);
  const childMap = new Map<string, typeof posts>();
  for (const p of posts || []) {
    if (p.parent_id) {
      const list = childMap.get(p.parent_id) || [];
      list.push(p);
      childMap.set(p.parent_id, list);
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <ViewCounter threadId={thread.id} initialCount={thread.view_count || 0} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {/* Header */}
          <header className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {thread.category && (
                <Link
                  href={`/c/${thread.category.slug}`}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium"
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
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-50 tracking-tight text-balance">
              {thread.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-sm text-stone-500">
              <span className="font-medium text-stone-700 dark:text-stone-300">
                {thread.author?.display_name || thread.author?.handle || "Anonymous"}
              </span>
              {thread.author?.is_verified && (
                <BadgeCheck className="w-4 h-4 text-brand-600" />
              )}
              <span>·</span>
              <time>{formatRelativeTime(thread.created_at)}</time>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" />
                {thread.reply_count}
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {thread.view_count || 0}
              </span>
            </div>

            <ThreadActions
              threadId={thread.id}
              title={thread.title}
              slug={thread.slug}
            />
          </header>

          {/* AI Summary — compact button only */}
          <div className="flex flex-wrap items-center gap-2">
            {thread.ai_summary ? (
              <SummaryCard summary={thread.ai_summary} />
            ) : (
              <GenerateSummaryButton
                threadId={thread.id}
                title={thread.title}
                language={thread.language === "sw" ? "sw" : "en"}
              />
            )}
          </div>

          {/* Posts */}
          <section className="divide-y divide-stone-100 dark:divide-stone-800 border-t border-stone-200 dark:border-stone-800">
            {rootPosts.map((post) => (
              <div key={post.id}>
                <PostItem post={post} threadId={thread.id} />
                {(childMap.get(post.id) || []).map((child) => (
                  <PostItem
                    key={child.id}
                    post={child}
                    threadId={thread.id}
                    depth={1}
                  />
                ))}
              </div>
            ))}
            {rootPosts.length === 0 && (
              <p className="py-8 text-center text-sm text-stone-500">
                No posts yet. Be the first to reply.
              </p>
            )}
          </section>

          {/* Reply */}
          <div className="pt-2">
            <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3">
              Continue the discussion
            </h2>
            <ReplyComposer threadId={thread.id} />
          </div>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50 mb-3">
              Thread stats
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone-500">Replies</dt>
                <dd className="font-medium">{thread.reply_count}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Views</dt>
                <dd className="font-medium">{thread.view_count || 0}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Last activity</dt>
                <dd className="font-medium">
                  {formatRelativeTime(thread.last_activity_at)}
                </dd>
              </div>
            </dl>
          </div>

          {related && related.length > 0 && (
            <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4">
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50 mb-3">
                Related threads
              </h3>
              <ul className="space-y-3">
                {related.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/t/${r.slug}`}
                      className="text-sm font-medium text-stone-800 dark:text-stone-200 hover:text-brand-600 line-clamp-2"
                    >
                      {r.title}
                    </Link>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {r.reply_count} replies ·{" "}
                      {formatRelativeTime(r.last_activity_at)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
