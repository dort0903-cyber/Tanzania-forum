"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthModal } from "@/components/auth/auth-modal";
import { Heart, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";

type ReactionType = "like" | "love";

interface ReactionBarProps {
  postId?: string;
  threadId?: string;
  initialLikeCount?: number;
  initialLoveCount?: number;
}

export function ReactionBar({
  postId,
  threadId,
  initialLikeCount = 0,
  initialLoveCount = 0,
}: ReactionBarProps) {
  const [likes, setLikes] = useState(initialLikeCount);
  const [loves, setLoves] = useState(initialLoveCount);
  const [myLike, setMyLike] = useState(false);
  const [myLove, setMyLove] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      let q = supabase
        .from("reactions")
        .select("type")
        .eq("user_id", user.id);

      if (postId) q = q.eq("post_id", postId);
      else if (threadId) q = q.eq("thread_id", threadId);

      const { data } = await q;
      if (data) {
        setMyLike(data.some((r) => r.type === "like"));
        setMyLove(data.some((r) => r.type === "insightful" || r.type === "like"));
        // love maps to our custom - we use 'like' and store love as... 
        // schema has: like, insightful, disagree, funny
        // Map: like -> like, love -> insightful (as stand-in) OR we can just use like for both
      }

      // Count
      if (postId) {
        const { count: likeCount } = await supabase
          .from("reactions")
          .select("*", { count: "exact", head: true })
          .eq("post_id", postId)
          .eq("type", "like");
        const { count: loveCount } = await supabase
          .from("reactions")
          .select("*", { count: "exact", head: true })
          .eq("post_id", postId)
          .eq("type", "insightful");
        setLikes(likeCount ?? 0);
        setLoves(loveCount ?? 0);
        setMyLike(!!data?.some((r) => r.type === "like"));
        setMyLove(!!data?.some((r) => r.type === "insightful"));
      }
    };
    load();
  }, [postId, threadId, supabase]);

  const toggle = async (kind: "like" | "love") => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setShowAuth(true);
      return;
    }

    const type = kind === "like" ? "like" : "insightful";
    const isActive = kind === "like" ? myLike : myLove;

    if (isActive) {
      let q = supabase
        .from("reactions")
        .delete()
        .eq("user_id", user.id)
        .eq("type", type);
      if (postId) q = q.eq("post_id", postId);
      else if (threadId) q = q.eq("thread_id", threadId);
      await q;
      if (kind === "like") {
        setMyLike(false);
        setLikes((c) => Math.max(0, c - 1));
      } else {
        setMyLove(false);
        setLoves((c) => Math.max(0, c - 1));
      }
    } else {
      const row: Record<string, string> = {
        user_id: user.id,
        type,
      };
      if (postId) row.post_id = postId;
      if (threadId) row.thread_id = threadId;
      await supabase.from("reactions").insert(row);
      if (kind === "like") {
        setMyLike(true);
        setLikes((c) => c + 1);
      } else {
        setMyLove(true);
        setLoves((c) => c + 1);
      }
    }
  };

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          onClick={() => toggle("like")}
          className={cn(
            "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg transition-colors",
            myLike
              ? "text-blue-600 bg-blue-50 dark:bg-blue-950/40"
              : "text-stone-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
          )}
        >
          <ThumbsUp className={cn("w-3.5 h-3.5", myLike && "fill-current")} />
          {likes > 0 && <span>{likes}</span>}
        </button>
        <button
          onClick={() => toggle("love")}
          className={cn(
            "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg transition-colors",
            myLove
              ? "text-rose-600 bg-rose-50 dark:bg-rose-950/40"
              : "text-stone-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
          )}
        >
          <Heart className={cn("w-3.5 h-3.5", myLove && "fill-current")} />
          {loves > 0 && <span>{loves}</span>}
        </button>
      </div>
      <AuthModal
        open={showAuth}
        onClose={() => setShowAuth(false)}
        title="Sign in to react"
        description="Continue with Google to like and love posts."
      />
    </>
  );
}
