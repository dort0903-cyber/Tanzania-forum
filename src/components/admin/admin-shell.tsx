"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Flag,
  ScrollText,
  Sparkles,
  FolderTree,
  ShieldCheck,
  Megaphone,
  Settings,
  ArrowLeft,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/moderation", label: "Moderation", icon: Flag },
  { href: "/admin/logs", label: "Audit Logs", icon: ScrollText },
  { href: "/admin/ai", label: "AI / Groq", icon: Sparkles },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/fact-checks", label: "TzCheck", icon: ShieldCheck },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

interface AdminShellProps {
  children: React.ReactNode;
  profile: {
    handle: string;
    display_name: string | null;
    role: string;
  };
}

export function AdminShell({ children, profile }: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-60 flex-col border-r border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shrink-0">
        <div className="h-14 flex items-center gap-2 px-4 border-b border-stone-200 dark:border-stone-800">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">T</span>
          </div>
          <span className="font-semibold text-sm text-stone-900 dark:text-stone-50">
            Admin
          </span>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300"
                    : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-stone-200 dark:border-stone-800">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-sm text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to forum
          </Link>
          <div className="mt-2 px-3 py-2 text-xs text-stone-400">
            Signed in as{" "}
            <span className="font-medium text-stone-600 dark:text-stone-300">
              {profile.display_name || profile.handle}
            </span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top status bar */}
        <header className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-2 text-sm text-stone-500">
            <Activity className="w-4 h-4 text-green-500" />
            <span className="hidden sm:inline">System operational</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-stone-400">
            <span>Groq: ready</span>
            <span className="w-1 h-1 rounded-full bg-stone-300" />
            <span className="capitalize">{profile.role}</span>
          </div>
        </header>

        {/* Mobile nav */}
        <div className="lg:hidden border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-x-auto">
          <nav className="flex gap-1 px-3 py-2">
            {NAV.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium",
                    active
                      ? "bg-brand-600 text-white"
                      : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
