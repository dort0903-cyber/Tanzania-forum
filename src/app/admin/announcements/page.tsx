import { createClient } from "@/lib/supabase/server";
import { AnnouncementForm } from "@/components/admin/announcement-form";
import { formatRelativeTime } from "@/lib/utils";

export default async function AdminAnnouncementsPage() {
  const supabase = await createClient();

  const { data: announcements } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
          Announcements
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Site-wide banners and notices.
        </p>
      </div>

      <section className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6">
        <h2 className="text-sm font-semibold mb-4">New announcement</h2>
        <AnnouncementForm />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Recent announcements</h2>
        {announcements && announcements.length > 0 ? (
          announcements.map((a) => (
            <div
              key={a.id}
              className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    a.is_active
                      ? "bg-green-100 text-green-700"
                      : "bg-stone-100 text-stone-500"
                  }`}
                >
                  {a.is_active ? "Active" : "Inactive"}
                </span>
                <span className="text-xs text-stone-400">
                  {formatRelativeTime(a.created_at)}
                </span>
              </div>
              <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                {a.title_en}
              </p>
              <p className="text-sm text-stone-500 mt-1 line-clamp-2">
                {a.body_en}
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-stone-500 py-8 text-center border border-dashed rounded-xl">
            No announcements yet.
          </p>
        )}
      </section>
    </div>
  );
}
