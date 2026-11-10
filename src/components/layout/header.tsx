"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import {
  Search,
  Moon,
  Sun,
  Menu,
  Globe,
  LogIn,
  Landmark,
  Heart,
  TrendingUp,
  Cpu,
  ShieldCheck,
  Users,
  Flame,
  MoreHorizontal,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { AuthButton } from "@/components/auth/auth-button";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: null },
  { href: "/c/siasa", label: "Siasa", icon: Landmark },
  { href: "/c/uhusiano-mapenzi", label: "Uhusiano & Mapenzi", icon: Heart },
  { href: "/c/uchumi-biashara", label: "Uchumi na Biashara", icon: TrendingUp },
  { href: "/c/tech-gadgets", label: "Tech & Gadgets", icon: Cpu },
  { href: "/c/jamiicheck", label: "JamiiCheck", icon: ShieldCheck },
  { href: "/trending", label: "Trending", icon: Flame },
];

export function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<"en" | "sw">("en");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  const toggleLang = () => setLang((l) => (l === "en" ? "sw" : "en"));

  return (
    <header className="sticky top-0 z-50 glass-strong border-b border-stone-200/60 dark:border-stone-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
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

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 text-sm font-medium text-stone-600 dark:text-stone-300 hover:text-brand-700 dark:hover:text-brand-400 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <button className="px-3 py-2 text-sm font-medium text-stone-600 dark:text-stone-300 hover:text-brand-700 dark:hover:text-brand-400 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-colors flex items-center gap-1">
              More
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2.5 rounded-xl text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Language toggle */}
            <button
              onClick={toggleLang}
              className="p-2.5 rounded-xl text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex items-center gap-1.5"
              aria-label="Toggle language"
            >
              <Globe className="w-5 h-5" />
              <span className="text-xs font-semibold uppercase hidden sm:inline">
                {lang}
              </span>
            </button>

            {/* Theme toggle */}
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

            {/* Auth */}
            <div className="hidden sm:block ml-1">
              <AuthButton />
            </div>

            {/* Mobile menu */}
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

      {/* Mobile dropdown */}
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
                {item.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
              <AuthButton />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
