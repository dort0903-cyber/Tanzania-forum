"use client";

import { useState } from "react";
import { formatRelativeTime } from "@/lib/utils";
import { BadgeCheck, MessageSquare, Flag, Quote } from "lucide-react";
import type { Post } from "@/types/database";
import { ReplyComposer } from "./reply-composer";
import { ReactionBar } from "./reaction-bar";
import { PostContent } from "./post-content";

interface PostItemProps {
  post: Post & {
    author?: {
      handle: string;
      display_name: string | null;
      avatar_url: string | null;
      is_verified: boolean;
      role: string;
    };
  };
  threadId: string;
  depth?: number;
}

export function PostItem({ post, threadId, depth = 0 }: PostItemProps) {
  const [showReply, setShowReply] = useState(false);

  return (
    <div
      className={`${
        depth > 0
          ? "ml-4 sm:ml-8 border-l-2 border-stone-200 dark:border-stone-800 pl-4"
          : ""
      }`}
    >
      <article className="py-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-300 text-sm font-semibold shrink-0">
            {(post.author?.display_name || post.author?.handle || "A")[0].toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
              <span className="font-semibold text-stone-900 dark:text-stone-100">
                {post.author?.display_name || post.author?.handle || "Anonymous"}
              </span>
              {post.author?.is_verified && (
                <BadgeCheck className="w-4 h-4 text-brand-600" />
              )}
              <span className="text-stone-400">@{post.author?.handle}</span>
              <span className="text-stone-400">·</span>
              <time className="text-stone-400 text-xs">
                {formatRelativeTime(post.created_at)}
              </time>
            </div>

            <PostContent html={post.body} />

            <div className="mt-3 flex flex-wrap items-center gap-1">
              <ReactionBar postId={post.id} />
              <button
                type="button"
                onClick={() => setShowReply(!showReply)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-stone-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40 rounded-lg transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Reply
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
              >
                <Quote className="w-3.5 h-3.5" />
                Quote
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-stone-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
              >
                <Flag className="w-3.5 h-3.5" />
                Report
              </button>
            </div>

            {showReply && (
              <div className="mt-3">
                <ReplyComposer
                  threadId={threadId}
                  parentId={post.id}
                  placeholder={`Reply to ${post.author?.display_name || post.author?.handle || "this post"}…`}
                  onSuccess={() => setShowReply(false)}
                />
              </div>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
