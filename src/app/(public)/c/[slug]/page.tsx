import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ThreadCard } from "@/components/forum/thread-card";
import { CategoryFollowButton } from "@/components/forum/category-follow-button";
import { Plus } from "lucide-react";

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; lang?: string }>;
}) {
  const { slug } = await params;
  const { sort = "latest", lang } = await searchParams;
  const supabase = await createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!category) notFound();

  let query = supabase
    .from("threads")
    .select(
      `
      *,
      category:categories(id, slug, name_en, name_sw, color),
      author:profiles(id, handle, display_name, avatar_url, is_verified, role)
    `
    )
    .eq("category_id", category.id)
    .eq("status", "published");

  if (lang === "en" || lang === "sw") {
    query = query.eq("language", lang);
  }

  if (sort === "replies") {
    query = query.order("reply_count", { ascending: false });
  } else if (sort === "views") {
    query = query.order("view_count", { ascending: false });
  } else {
    query = query.order("last_activity_at", { ascending: false });
  }

  const { data: threads } = await query.limit(40);

  const filters = [
    { key: "latest", label: "Latest" },
    { key: "replies", label: "Most replied" },
    { key: "views", label: "Most viewed" },
  ];

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div
              className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold mb-3"
              style={{
                backgroundColor: `${category.color}18`,
                color: category.color,
              }}
            >
              {category.name_en}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-50">
              {category.name_en}
            </h1>
            {category.description_en && (
              <p className="mt-2 text-stone-600 dark:text-stone-400 max-w-2xl">
                {category.description_en}
              </p>
            )}
            <p className="mt-3 text-sm text-stone-500">
              {category.thread_count || 0} discussions
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <CategoryFollowButton categoryId={category.id} />
            <Link
              href={`/new?category=${category.slug}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              New discussion
            </Link>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {filters.map((f) => (
          <Link
            key={f.key}
            href={`/c/${slug}?sort=${f.key}${lang ? `&lang=${lang}` : ""}`}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              sort === f.key
                ? "bg-brand-600 text-white"
                : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700"
            }`}
          >
            {f.label}
          </Link>
        ))}
        <span className="w-px h-5 bg-stone-200 dark:bg-stone-700 mx-1" />
        {["en", "sw"].map((l) => (
          <Link
            key={l}
            href={`/c/${slug}?sort=${sort}&lang=${l}`}
            className={`px-3 py-1.5 text-xs font-semibold uppercase rounded-lg transition-colors ${
              lang === l
                ? "bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900"
                : "bg-stone-100 dark:bg-stone-800 text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-700"
            }`}
          >
            {l}
          </Link>
        ))}
        {lang && (
          <Link
            href={`/c/${slug}?sort=${sort}`}
            className="px-3 py-1.5 text-xs font-medium text-stone-500 hover:text-stone-800"
          >
            Clear lang
          </Link>
        )}
      </div>

      <div className="space-y-3">
        {(threads || []).map((thread) => (
          <ThreadCard key={thread.id} thread={thread} />
        ))}
        {(!threads || threads.length === 0) && (
          <div className="rounded-xl border border-dashed border-stone-200 dark:border-stone-700 p-12 text-center">
            <p className="text-stone-500 text-sm">
              No discussions yet. Start the first one.
            </p>
            <Link
              href={`/new?category=${category.slug}`}
              className="inline-flex mt-4 items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl"
            >
              <Plus className="w-4 h-4" />
              Start a discussion
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
