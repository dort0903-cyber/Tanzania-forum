"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthModal } from "@/components/auth/auth-modal";
import { Bell, BellOff } from "lucide-react";

export function CategoryFollowButton({ categoryId }: { categoryId: string }) {
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const check = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_category_id", categoryId)
        .maybeSingle();
      setFollowing(!!data);
      setLoading(false);
    };
    check();
  }, [categoryId, supabase]);

  const toggle = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setShowAuth(true);
      return;
    }

    if (following) {
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_category_id", categoryId);
      setFollowing(false);
    } else {
      await supabase.from("follows").insert({
        follower_id: user.id,
        following_category_id: categoryId,
      });
      setFollowing(true);
    }
  };

  if (loading) {
    return (
      <div className="h-8 w-20 bg-stone-200 dark:bg-stone-700 rounded-lg animate-pulse" />
    );
  }

  return (
    <>
      <button
        onClick={toggle}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
          following
            ? "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200"
            : "bg-brand-600 text-white hover:bg-brand-700"
        }`}
      >
        {following ? (
          <>
            <BellOff className="w-3.5 h-3.5" /> Following
          </>
        ) : (
          <>
            <Bell className="w-3.5 h-3.5" /> Follow
          </>
        )}
      </button>
      <AuthModal
        open={showAuth}
        onClose={() => setShowAuth(false)}
        title="Sign in to follow"
        description="Continue with Google to follow categories and get updates."
      />
    </>
  );
}
