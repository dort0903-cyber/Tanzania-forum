import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminCategoriesPage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
            Categories
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Manage forums, rules, and ordering.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/80">
              <th className="text-left px-4 py-3 font-medium text-stone-500">
                Order
              </th>
              <th className="text-left px-4 py-3 font-medium text-stone-500">
                Name
              </th>
              <th className="text-left px-4 py-3 font-medium text-stone-500">
                Slug
              </th>
              <th className="text-left px-4 py-3 font-medium text-stone-500">
                Threads
              </th>
              <th className="text-left px-4 py-3 font-medium text-stone-500">
                Status
              </th>
              <th className="text-left px-4 py-3 font-medium text-stone-500">
                AI sensitivity
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
            {categories?.map((cat) => (
              <tr
                key={cat.id}
                className="hover:bg-stone-50 dark:hover:bg-stone-800/40"
              >
                <td className="px-4 py-3 text-stone-500">{cat.sort_order}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <div>
                      <p className="font-medium text-stone-900 dark:text-stone-100">
                        {cat.name_en}
                      </p>
                      <p className="text-xs text-stone-400">{cat.name_sw}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-stone-500">
                  {cat.slug}
                </td>
                <td className="px-4 py-3 text-stone-600 dark:text-stone-300">
                  {cat.thread_count}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      cat.is_active
                        ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                        : "bg-stone-100 text-stone-500"
                    }`}
                  >
                    {cat.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-stone-600 dark:text-stone-300">
                  {cat.ai_sensitivity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-stone-400">
        Category create/edit forms can be expanded in a future iteration. Seed
        data is already present from the schema.
      </p>
    </div>
  );
}
