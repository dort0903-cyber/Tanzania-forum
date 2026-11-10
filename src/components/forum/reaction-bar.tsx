"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Heart } from "lucide-react";
import { AuthModal } from "@/components/auth/auth-modal";

export function ReactionBar({ postId }: { postId: string }) {
  const [count, setCount] = useState(0);
  const [loved, setLoved] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [busy, setBusy] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    const supabase = createClient();

    const load = async () => {
      const { count: total } = await supabase
        .from("reactions")
        .select("id", { count: "exact", head: true })
        .eq("post_id", postId)
        .eq("type", "love");

      setCount(total || 0);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("reactions")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .eq("type", "love")
        .maybeSingle();

      setLoved(!!data);
    };

    void load();
  }, [postId]);

  const toggle = async () => {
    if (busy) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setShowAuth(true);
      return;
    }

    setBusy(true);
    try {
      if (loved) {
        await supabase
          .from("reactions")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id)
          .eq("type", "love");
        setLoved(false);
        setCount((c) => Math.max(0, c - 1));
      } else {
        await supabase.from("reactions").insert({
          post_id: postId,
          user_id: user.id,
          type: "love",
        });
        setLoved(true);
        setCount((c) => c + 1);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
          loved
            ? "text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400"
            : "text-stone-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
        }`}
      >
        <Heart className={`w-3.5 h-3.5 ${loved ? "fill-current" : ""}`} />
        {count > 0 ? count : ""}
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
