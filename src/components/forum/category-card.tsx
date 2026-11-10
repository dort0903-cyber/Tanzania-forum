import Link from "next/link";
import {
  Landmark,
  Heart,
  TrendingUp,
  Cpu,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Category } from "@/types/database";

const ICON_MAP: Record<string, LucideIcon> = {
  Landmark,
  Heart,
  TrendingUp,
  Cpu,
  ShieldCheck,
  Users,
};

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  const Icon = category.icon ? ICON_MAP[category.icon] || Users : Users;

  return (
    <Link
      href={`/c/${category.slug}`}
      className="group flex flex-col gap-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-sm transition-all"
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${category.color}18` }}
      >
        <Icon className="w-4.5 h-4.5" style={{ color: category.color }} />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50 group-hover:text-brand-700 dark:group-hover:text-brand-400">
          {category.name_en}
        </h3>
        <p className="text-xs text-stone-500 mt-0.5">
          {category.thread_count} threads
        </p>
      </div>
    </Link>
  );
}
