"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthModal } from "@/components/auth/auth-modal";
import { Send, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface ReplyComposerProps {
  threadId: string;
  parentId?: string | null;
  isLocked?: boolean;
  placeholder?: string;
  onSuccess?: () => void;
}

export function ReplyComposer({
  threadId,
  parentId = null,
  isLocked = false,
  placeholder = "Write your reply…",
  onSuccess,
}: ReplyComposerProps) {
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(!!user);
    });
  }, [supabase]);

  const handleFocus = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setShowAuth(true);
    } else {
      setIsAuthenticated(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || loading) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setShowAuth(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from("posts").insert({
        thread_id: threadId,
        author_id: user.id,
        parent_id: parentId,
        body: body.trim(),
        language: "en",
        status: "published",
      });

      if (insertError) throw insertError;

      setBody("");
      router.refresh();
      onSuccess?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to post reply";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (isLocked) {
    return (
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50 p-6 text-center">
        <p className="text-sm text-stone-500">This thread is locked.</p>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="relative">
        <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden focus-within:ring-2 focus-within:ring-brand-500/30 focus-within:border-brand-500 transition-shadow">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onFocus={handleFocus}
            placeholder={placeholder}
            rows={3}
            className="w-full resize-none bg-transparent px-4 py-3 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none"
            disabled={loading}
          />
          <div className="flex items-center justify-between px-3 py-2 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
            <p className="text-xs text-stone-400">
              Be respectful. Follow community guidelines.
            </p>
            <button
              type="submit"
              disabled={!body.trim() || loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              Reply
            </button>
          </div>
        </div>
        {error && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
      </form>

      <AuthModal
        open={showAuth}
        onClose={() => setShowAuth(false)}
        title="Sign in to join the discussion"
        description="Continue with Google to post replies and participate."
        next={`/t/${threadId}`}
      />
    </>
  );
}
