import Link from "next/link";
import { MessageSquare, Sparkles, BadgeCheck } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import type { Thread } from "@/types/database";

interface ThreadCardProps {
  thread: Thread & {
    category?: { slug: string; name_en: string; name_sw: string; color: string };
    author?: {
      handle: string;
      display_name: string | null;
      is_verified: boolean;
      role: string;
    };
  };
}

export function ThreadCard({ thread }: ThreadCardProps) {
  return (
    <Link
      href={`/t/${thread.slug}`}
      className="block rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            {thread.category && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
                style={{
                  backgroundColor: `${thread.category.color}18`,
                  color: thread.category.color,
                }}
              >
                {thread.category.name_en}
              </span>
            )}
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-stone-100 dark:bg-stone-800 text-stone-500">
              {thread.language}
            </span>
            {thread.ai_summary && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">
                <Sparkles className="w-3 h-3" />
                AI Summary
              </span>
            )}
          </div>

          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50 group-hover:text-brand-700 dark:group-hover:text-brand-400 line-clamp-2 leading-snug">
            {thread.title}
          </h3>

          <div className="mt-2 flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
            <span className="flex items-center gap-1">
              {thread.author?.handle ? (
                <span className="hover:text-brand-600">
                  {thread.author?.display_name || thread.author?.handle}
                </span>
              ) : (
                "Anonymous"
              )}
              {thread.author?.is_verified && (
                <BadgeCheck className="w-3.5 h-3.5 text-brand-600" />
              )}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              {thread.reply_count}
            </span>
            <span>·</span>
            <span>{formatRelativeTime(thread.last_activity_at)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
