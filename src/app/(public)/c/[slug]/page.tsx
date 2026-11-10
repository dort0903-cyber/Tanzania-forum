import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ThreadCard } from "@/components/forum/thread-card";
import { CategoryFollowButton } from "@/components/forum/category-follow-button";
import Link from "next/link";
import {
  Landmark,
  Heart,
  TrendingUp,
  Cpu,
  ShieldCheck,
  Users,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Landmark,
  Heart,
  TrendingUp,
  Cpu,
  ShieldCheck,
  Users,
};

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; lang?: string }>;
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { sort = "latest", lang } = await searchParams;
  const supabase = await createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!category) notFound();

  let query = supabase
    .from("threads")
    .select(
      `
      *,
      category:categories(*),
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
  }  else {
    query = query.order("last_activity_at", { ascending: false });
  }

  const { data: threads } = await query.limit(30);

  const Icon = category.icon ? ICON_MAP[category.icon] || Users : Users;

  return (
    <div className="space-y-6">
      {/* Category header */}
      <header className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${category.color}18` }}
          >
            <Icon className="w-7 h-7" style={{ color: category.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
              {category.name_en}
            </h1>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              {category.name_sw}
            </p>
            {category.description_en && (
              <p className="mt-3 text-sm text-stone-600 dark:text-stone-300 leading-relaxed max-w-2xl">
                {category.description_en}
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium text-stone-500">
                {category.thread_count} threads
              </span>
              <CategoryFollowButton categoryId={category.id} />
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: "latest", label: "Latest" },
          { key: "replies", label: "Most replied" },
          { key: "views", label: "Most viewed" },
        ].map((f) => (
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
        {[
          { key: "", label: "All languages" },
          { key: "en", label: "English" },
          { key: "sw", label: "Kiswahili" },
        ].map((f) => (
          <Link
            key={f.key || "all"}
            href={`/c/${slug}?sort=${sort}${f.key ? `&lang=${f.key}` : ""}`}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              (lang || "") === f.key
                ? "bg-brand-600 text-white"
                : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Thread list */}
      <div className="space-y-3">
        {threads && threads.length > 0 ? (
          threads.map((thread) => <ThreadCard key={thread.id} thread={thread} />)
        ) : (
          <div className="rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/50 px-6 py-16 text-center">
            <MessageSquare className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300">
              No threads yet
            </h3>
            <p className="mt-1 text-sm text-stone-500">
              Be the first to start a discussion in this category.
            </p>
            <Link
              href={`/new?category=${category.slug}`}
              className="inline-flex mt-4 px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl"
            >
              Start a discussion
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
