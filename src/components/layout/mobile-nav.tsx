"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Flame, Search, PlusCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/trending", label: "Trending", icon: Flame },
  { href: "/new", label: "Post", icon: PlusCircle },
  { href: "/search", label: "Search", icon: Search },
  { href: "/me", label: "Profile", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 glass-strong border-t border-stone-200/60 dark:border-stone-800/60 pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 w-16 h-full text-xs font-medium transition-colors",
                isActive
                  ? "text-brand-600 dark:text-brand-400"
                  : "text-stone-500 dark:text-stone-400"
              )}
            >
              <Icon
                className={cn("w-5 h-5", isActive && "stroke-[2.5px]")}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
