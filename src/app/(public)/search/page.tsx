"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams, useRouter } from "next/navigation";
import { ThreadCard } from "@/components/forum/thread-card";
import { Search, Loader2 } from "lucide-react";
import type { Thread } from "@/types/database";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const qParam = searchParams.get("q") || "";
  const [query, setQuery] = useState(qParam);
  const [results, setResults] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (qParam) {
      setQuery(qParam);
      performSearch(qParam);
    }
  }, [qParam]);

  const performSearch = async (term: string) => {
    if (!term.trim()) return;
    setLoading(true);
    setSearched(true);

    const { data } = await supabase
      .from("threads")
      .select(
        `
        *,
        category:categories(*),
        author:profiles(id, handle, display_name, avatar_url, is_verified, role)
      `
      )
      .eq("status", "published")
      .or(`title.ilike.%${term}%,slug.ilike.%${term}%`)
      .order("last_activity_at", { ascending: false })
      .limit(20);

    setResults(data || []);
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = query.trim();
    if (!term) return;
    router.push(`/search?q=${encodeURIComponent(term)}`);
    performSearch(term);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
        Search
      </h1>

      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search threads, topics…"
          className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
          autoFocus
        />
      </form>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
        </div>
      )}

      {!loading && searched && (
        <div className="space-y-3">
          <p className="text-sm text-stone-500">
            {results.length} result{results.length !== 1 ? "s" : ""} for “{qParam || query}”
          </p>
          {results.length > 0 ? (
            results.map((thread) => (
              <ThreadCard key={thread.id} thread={thread} />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 px-6 py-12 text-center text-sm text-stone-500">
              No threads found. Try different keywords.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
