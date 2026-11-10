import { createClient } from "@/lib/supabase/server";
import { ThreadCard } from "@/components/forum/thread-card";
import { Flame } from "lucide-react";

export default async function TrendingPage() {
  const supabase = await createClient();

  const { data: threads } = await supabase
    .from("threads")
    .select(
      `
      *,
      category:categories(*),
      author:profiles(id, handle, display_name, avatar_url, is_verified, role)
    `
    )
    .eq("status", "published")
    .order("reply_count", { ascending: false })
    .limit(30);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Flame className="w-6 h-6 text-orange-500" />
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
          Trending
        </h1>
      </div>
      <p className="text-sm text-stone-500 -mt-3">
        Discussions ranked by engagement and activity.
      </p>

      <div className="space-y-3">
        {threads && threads.length > 0 ? (
          threads.map((thread) => (
            <ThreadCard key={thread.id} thread={thread} />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 px-6 py-16 text-center text-sm text-stone-500">
            No trending discussions yet. Start one!
          </div>
        )}
      </div>
    </div>
  );
}
