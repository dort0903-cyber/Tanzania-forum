"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthModal } from "@/components/auth/auth-modal";
import { Share2, Bookmark, Flag, Check } from "lucide-react";

interface ThreadActionsProps {
  threadId: string;
  title: string;
  slug: string;
}

export function ThreadActions({ threadId, title, slug }: ThreadActionsProps) {
  const [bookmarked, setBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const check = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("user_id", user.id)
        .eq("thread_id", threadId)
        .maybeSingle();
      setBookmarked(!!data);
    };
    check();
  }, [threadId, supabase]);

  const handleShare = async () => {
    const url = `${window.location.origin}/t/${slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBookmark = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setShowAuth(true);
      return;
    }
    if (bookmarked) {
      await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", user.id)
        .eq("thread_id", threadId);
      setBookmarked(false);
    } else {
      await supabase.from("bookmarks").insert({
        user_id: user.id,
        thread_id: threadId,
      });
      setBookmarked(true);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-600" /> Copied
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" /> Share
            </>
          )}
        </button>
        <button
          onClick={handleBookmark}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            bookmarked
              ? "text-brand-700 bg-brand-50 dark:bg-brand-950/40 dark:text-brand-300"
              : "text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700"
          }`}
        >
          <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? "fill-current" : ""}`} />
          {bookmarked ? "Saved" : "Bookmark"}
        </button>
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 rounded-lg transition-colors">
          <Flag className="w-3.5 h-3.5" /> Report
        </button>
      </div>
      <AuthModal
        open={showAuth}
        onClose={() => setShowAuth(false)}
        title="Sign in to bookmark"
        description="Continue with Google to save threads."
      />
    </>
  );
}
