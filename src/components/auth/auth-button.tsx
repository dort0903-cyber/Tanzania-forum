"use client";

import { useState, useEffect, useRef } from "react";
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
  const initDone = useRef(false);

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    const supabase = createClient();
    let mounted = true;

    const loadProfile = async (userId: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (!mounted) return;

      if (data) {
        setProfile(data);
        return;
      }

      // Fallback create only if truly missing
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      if (!u || u.id !== userId || !mounted) return;

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

      if (mounted && created) setProfile(created);
    };

    const init = async () => {
      try {
        const {
          data: { user: u },
        } = await supabase.auth.getUser();
        if (!mounted) return;
        setUser(u);
        if (u) await loadProfile(u.id);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      // Ignore noisy token refresh events — they must NOT re-render the shell
      if (event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
        return;
      }

      const u = session?.user ?? null;
      setUser(u);

      if (u) {
        void loadProfile(u.id);
      } else {
        setProfile(null);
      }

      // Full reload only after real sign-in from OAuth (not every event)
      if (event === "SIGNED_IN") {
        // Soft navigation — avoid hard reload loops
        // OAuth callback already redirected; only refresh if still on login-looking state
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignIn = async () => {
    const supabase = createClient();
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
    const supabase = createClient();
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
        type="button"
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
        type="button"
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
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-lg z-50 py-1">
            <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800">
              <p className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
                {display}
              </p>
              <p className="text-xs text-stone-500 truncate">@{profile?.handle}</p>
            </div>
            {profile?.handle && (
              <Link
                href={`/u/${profile.handle}`}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800"
              >
                <User className="w-4 h-4" />
                Profile
              </Link>
            )}
            {profile?.role === "admin" && (
              <Link
                href="/admin"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
              >
                <Shield className="w-4 h-4" />
                Admin panel
              </Link>
            )}
            <Link
              href="/me"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
