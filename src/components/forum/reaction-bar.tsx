"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthModal } from "@/components/auth/auth-modal";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReactionBarProps {
  postId?: string;
  threadId?: string;
}

export function ReactionBar({ postId, threadId }: ReactionBarProps) {
  const [loves, setLoves] = useState(0);
  const [myLove, setMyLove] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      if (!postId && !threadId) return;

      let countQ = supabase
        .from("reactions")
        .select("*", { count: "exact", head: true })
        .eq("type", "like");
      if (postId) countQ = countQ.eq("post_id", postId);
      else countQ = countQ.eq("thread_id", threadId!);
      const { count } = await countQ;
      setLoves(count ?? 0);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      let mineQ = supabase
        .from("reactions")
        .select("id")
        .eq("user_id", user.id)
        .eq("type", "like");
      if (postId) mineQ = mineQ.eq("post_id", postId);
      else mineQ = mineQ.eq("thread_id", threadId!);
      const { data } = await mineQ.maybeSingle();
      setMyLove(!!data);
    };
    load();
  }, [postId, threadId, supabase]);

  const toggle = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setShowAuth(true);
      return;
    }

    if (myLove) {
      let q = supabase
        .from("reactions")
        .delete()
        .eq("user_id", user.id)
        .eq("type", "like");
      if (postId) q = q.eq("post_id", postId);
      else q = q.eq("thread_id", threadId!);
      await q;
      setMyLove(false);
      setLoves((c) => Math.max(0, c - 1));
    } else {
      const row: Record<string, string> = {
        user_id: user.id,
        type: "like",
      };
      if (postId) row.post_id = postId;
      if (threadId) row.thread_id = threadId;
      await supabase.from("reactions").insert(row);
      setMyLove(true);
      setLoves((c) => c + 1);
    }
  };

  return (
    <>
      <button
        onClick={toggle}
        className={cn(
          "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg transition-colors",
          myLove
            ? "text-rose-600 bg-rose-50 dark:bg-rose-950/40"
            : "text-stone-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
        )}
        aria-label="Love"
      >
        <Heart className={cn("w-3.5 h-3.5", myLove && "fill-current")} />
        {loves > 0 && <span>{loves}</span>}
      </button>
      <AuthModal
        open={showAuth}
        onClose={() => setShowAuth(false)}
        title="Sign in to react"
        description="Continue with Google to love posts."
      />
    </>
  );
}
