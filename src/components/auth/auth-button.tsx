"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { LogIn, LogOut, User, Settings, Shield } from "lucide-react";
import Link from "next/link";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { Profile } from "@/types/database";

export function AuthButton() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const supabase = createClient();

  const loadProfile = useCallback(
    async (userId: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (data) {
        setProfile(data);
        return;
      }

      // Profile missing — create one from client as fallback
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      if (!u || u.id !== userId) return;

      const base =
        (u.user_metadata?.full_name as string)?.replace(/\s+/g, "").slice(0, 12) ||
        u.email?.split("@")[0] ||
        "User";
      const handle = `${base}${Math.floor(1000 + Math.random() * 9000)}`.replace(
        /[^a-zA-Z0-9]/g,
        ""
      );

      const { data: created } = await supabase
        .from("profiles")
        .insert({
          id: u.id,
          handle,
          display_name: (u.user_metadata?.full_name as string) || handle,
          role: "member",
          google_email: u.email,
          status: "active",
        })
        .select("*")
        .maybeSingle();

      if (created) setProfile(created);
    },
    [supabase]
  );

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      if (!mounted) return;
      setUser(u);
      if (u) await loadProfile(u.id);
      if (mounted) setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        await loadProfile(u.id);
      } else {
        setProfile(null);
      }
      // Refresh after successful sign-in so server components see the session
      if (event === "SIGNED_IN") {
        window.location.href = window.location.pathname || "/";
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, loadProfile]);

  const handleSignIn = async () => {
    const origin = window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(
          window.location.pathname || "/"
        )}`,
        queryParams: {
          access_type: "offline",
          prompt: "select_account",
        },
      },
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setMenuOpen(false);
    setUser(null);
    setProfile(null);
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="h-9 w-24 bg-stone-200 dark:bg-stone-700 rounded-xl animate-pulse" />
    );
  }

  if (!user) {
    return (
      <button
        onClick={handleSignIn}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition-colors"
      >
        <LogIn className="w-4 h-4" />
        <span>Sign in</span>
      </button>
    );
  }

  const display =
    profile?.display_name || profile?.handle || user.email?.split("@")[0] || "User";

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-300 font-semibold text-sm">
          {display[0]?.toUpperCase() || "U"}
        </div>
        <span className="text-sm font-medium text-stone-700 dark:text-stone-200 max-w-[100px] truncate hidden md:inline">
          {display}
        </span>
      </button>

      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-lg z-50 py-1">
            <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800">
              <p className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
                {display}
              </p>
              {profile?.handle && (
                <p className="text-xs text-stone-500 truncate">@{profile.handle}</p>
              )}
              {profile?.role === "admin" && (
                <span className="inline-flex items-center gap-1 mt-1 text-xs font-medium text-amber-600">
                  <Shield className="w-3 h-3" /> Admin
                </span>
              )}
            </div>
            {profile?.handle && (
              <Link
                href={`/u/${profile.handle}`}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800"
              >
                <User className="w-4 h-4" /> Profile
              </Link>
            )}
            <Link
              href="/settings"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800"
            >
              <Settings className="w-4 h-4" /> Settings
            </Link>
            {profile?.role === "admin" && (
              <Link
                href="/admin"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800"
              >
                <Shield className="w-4 h-4" /> Admin Panel
              </Link>
            )}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
