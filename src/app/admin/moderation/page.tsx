import { createClient } from "@/lib/supabase/server";
import { ModerationActions } from "@/components/admin/moderation-actions";
import { formatRelativeTime } from "@/lib/utils";
import { Flag, Sparkles } from "lucide-react";

export default async function AdminModerationPage() {
  const supabase = await createClient();

  // AI-flagged posts
  const { data: flaggedPosts } = await supabase
    .from("posts")
    .select(
      `
      id, body, ai_flag_reason, ai_confidence, created_at, status,
      author:profiles(handle, display_name),
      thread:threads(id, title, slug)
    `
    )
    .eq("is_ai_flagged", true)
    .neq("status", "deleted")
    .order("created_at", { ascending: false })
    .limit(30);

  // Open reports
  const { data: reports } = await supabase
    .from("reports")
    .select(
      `
      id, reason, details, status, priority, created_at,
      reporter:profiles!reporter_id(handle, display_name),
      post:posts(id, body),
      thread:threads(id, title, slug)
    `
    )
    .eq("status", "open")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
          Content moderation
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Review AI-flagged posts and user reports.
        </p>
      </div>

      {/* AI Flagged */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          AI-flagged posts ({flaggedPosts?.length ?? 0})
        </h2>
        <div className="space-y-3">
          {flaggedPosts && flaggedPosts.length > 0 ? (
            flaggedPosts.map((post: any) => (
              <div
                key={post.id}
                className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-white dark:bg-stone-900 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                  <div className="text-xs text-stone-500">
                    by{" "}
                    <span className="font-medium text-stone-700 dark:text-stone-300">
                      {post.author?.display_name || post.author?.handle}
                    </span>{" "}
                    · {formatRelativeTime(post.created_at)}
                    {post.thread && (
                      <>
                        {" "}
                        · in{" "}
                        <a
                          href={`/t/${post.thread.slug}`}
                          className="text-brand-600 hover:underline"
                        >
                          {post.thread.title}
                        </a>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {post.ai_confidence != null && (
                      <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                        {Math.round(post.ai_confidence * 100)}% confidence
                      </span>
                    )}
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                      {post.ai_flag_reason || "Flagged"}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-stone-800 dark:text-stone-200 line-clamp-3 mb-3">
                  {post.body}
                </p>
                <ModerationActions postId={post.id} currentStatus={post.status} />
              </div>
            ))
          ) : (
            <p className="text-sm text-stone-500 py-6 text-center border border-dashed border-stone-300 dark:border-stone-700 rounded-xl">
              No AI-flagged posts in the queue.
            </p>
          )}
        </div>
      </section>

      {/* User reports */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50 flex items-center gap-2">
          <Flag className="w-4 h-4 text-red-500" />
          Open reports ({reports?.length ?? 0})
        </h2>
        <div className="space-y-3">
          {reports && reports.length > 0 ? (
            reports.map((report: any) => (
              <div
                key={report.id}
                className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 mb-2">
                  <span className="font-medium text-stone-700 dark:text-stone-300">
                    {report.reason}
                  </span>
                  <span>·</span>
                  <span>
                    by {report.reporter?.display_name || report.reporter?.handle}
                  </span>
                  <span>·</span>
                  <span>{formatRelativeTime(report.created_at)}</span>
                  {report.priority > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
                      Priority {report.priority}
                    </span>
                  )}
                </div>
                {report.details && (
                  <p className="text-sm text-stone-600 dark:text-stone-400 mb-2">
                    {report.details}
                  </p>
                )}
                {report.post?.body && (
                  <p className="text-sm text-stone-800 dark:text-stone-200 bg-stone-50 dark:bg-stone-800/50 rounded-lg p-3 line-clamp-2">
                    {report.post.body}
                  </p>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-stone-500 py-6 text-center border border-dashed border-stone-300 dark:border-stone-700 rounded-xl">
              No open reports.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
