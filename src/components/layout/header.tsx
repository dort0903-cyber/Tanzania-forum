"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Search,
  Moon,
  Sun,
  Menu,
  Globe,
  Landmark,
  Heart,
  TrendingUp,
  Cpu,
  ShieldCheck,
  Flame,
  Shield,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { AuthButton } from "@/components/auth/auth-button";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/language-context";

const NAV_ITEMS = [
  { href: "/", labelEn: "Home", labelSw: "Nyumbani", icon: null },
  { href: "/c/siasa", labelEn: "Siasa", labelSw: "Siasa", icon: Landmark },
  {
    href: "/c/uhusiano-mapenzi",
    labelEn: "Uhusiano & Mapenzi",
    labelSw: "Uhusiano & Mapenzi",
    icon: Heart,
  },
  {
    href: "/c/uchumi-biashara",
    labelEn: "Uchumi na Biashara",
    labelSw: "Uchumi na Biashara",
    icon: TrendingUp,
  },
  {
    href: "/c/tech-gadgets",
    labelEn: "Tech & Gadgets",
    labelSw: "Tech & Gadgets",
    icon: Cpu,
  },
  {
    href: "/c/tzcheck",
    labelEn: "TzCheck",
    labelSw: "TzCheck",
    icon: ShieldCheck,
  },
  {
    href: "/trending",
    labelEn: "Trending",
    labelSw: "Zinazovuma",
    icon: Flame,
  },
];

export function Header() {
  const { theme, setTheme } = useTheme();
  const { lang, toggleLang, t } = useLanguage();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setMounted(true);
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      setIsAdmin(data?.role === "admin");
    });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSearchOpen(false);
    setSearchQuery("");
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="sticky top-0 z-50 glass-strong border-b border-stone-200/60 dark:border-stone-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shadow-sm group-hover:bg-brand-700 transition-colors">
              <span className="text-white font-bold text-lg tracking-tight">T</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-semibold text-stone-900 dark:text-stone-50 tracking-tight">
                Tanzania Forums
              </span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 text-sm font-medium text-stone-600 dark:text-stone-300 hover:text-brand-700 dark:hover:text-brand-400 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-colors"
              >
                {lang === "sw" ? item.labelSw : item.labelEn}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                className="px-3 py-2 text-sm font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5" />
                {t("Admin", "Admin")}
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2.5 rounded-xl text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={toggleLang}
              className="p-2.5 rounded-xl text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex items-center gap-1.5"
              aria-label="Toggle language"
              title={lang === "en" ? "Switch to Swahili" : "Switch to English"}
            >
              <Globe className="w-5 h-5" />
              <span className="text-xs font-semibold uppercase hidden sm:inline">
                {lang}
              </span>
            </button>

            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2.5 rounded-xl text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
            )}

            <div className="hidden sm:block ml-1">
              <AuthButton />
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-xl text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
              aria-label="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {searchOpen && (
        <div className="absolute inset-x-0 top-0 z-[60] border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-lg">
          <form
            onSubmit={handleSearch}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3"
          >
            <Search className="w-5 h-5 text-stone-400 shrink-0" />
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("Search threads…", "Tafuta midahalo…")}
              className="flex-1 bg-transparent text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery("");
              }}
              className="p-2 rounded-lg text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              <X className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
          <nav className="px-4 py-3 space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-stone-700 dark:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                {item.icon && <item.icon className="w-4 h-4 text-brand-600" />}
                {lang === "sw" ? item.labelSw : item.labelEn}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-amber-700 dark:text-amber-400 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/30"
              >
                <Shield className="w-4 h-4" />
                Admin Panel
              </Link>
            )}
            <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
              <AuthButton />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
