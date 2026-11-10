"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthModal } from "@/components/auth/auth-modal";
import { slugify } from "@/lib/utils";
import { Loader2, Send } from "lucide-react";
import type { Category } from "@/types/database";

function NewThreadForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselected = searchParams.get("category") || "";

  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [language, setLanguage] = useState<"en" | "sw">("en");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [checkedAuth, setCheckedAuth] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setShowAuth(true);
      }
      setCheckedAuth(true);

      const { data } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      setCategories(data || []);

      if (preselected && data) {
        const match = data.find((c) => c.slug === preselected);
        if (match) setCategoryId(match.id);
      }
    };
    init();
  }, [supabase, preselected]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim() || !categoryId || loading) return;

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
      const baseSlug = slugify(title);
      const slug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;

      // Create thread
      const { data: thread, error: threadError } = await supabase
        .from("threads")
        .insert({
          category_id: categoryId,
          author_id: user.id,
          title: title.trim(),
          slug,
          language,
          status: "published",
        })
        .select("id, slug")
        .single();

      if (threadError) throw threadError;

      // Create first post (the body)
      const { error: postError } = await supabase.from("posts").insert({
        thread_id: thread.id,
        author_id: user.id,
        body: body.trim(),
        language,
        status: "published",
      });

      if (postError) throw postError;

      router.push(`/t/${thread.slug}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create thread");
      setLoading(false);
    }
  };

  if (!checkedAuth) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50 mb-6">
          Start a discussion
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            >
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_en} / {c.name_sw}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
              placeholder="What is this discussion about?"
              className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
              Language
            </label>
            <div className="flex gap-2">
              {[
                { value: "en", label: "English" },
                { value: "sw", label: "Kiswahili" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLanguage(opt.value as "en" | "sw")}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    language === opt.value
                      ? "bg-brand-600 text-white"
                      : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
              Your post
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={8}
              placeholder="Share your thoughts, question, or idea…"
              className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 resize-y"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !title.trim() || !body.trim() || !categoryId}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Publish discussion
          </button>
        </form>
      </div>

      <AuthModal
        open={showAuth}
        onClose={() => {
          setShowAuth(false);
          if (!checkedAuth) router.push("/");
        }}
        title="Sign in to start a discussion"
        description="Continue with Google to create threads and join the community."
        next="/new"
      />
    </>
  );
}

export default function NewThreadPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
        </div>
      }
    >
      <NewThreadForm />
    </Suspense>
  );
}
