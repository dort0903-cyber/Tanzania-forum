"use client";

import { Plus, Activity } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/language-context";

export function SecondaryBar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(!!user);
    });
  }, []);

  const handleStartDiscussion = async () => {
    if (!isAuthenticated) {
      const supabase = createClient();
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/new`,
        },
      });
      return;
    }
    window.location.href = "/new";
  };

  return (
    <div className="sticky top-16 z-40 border-b border-stone-200/60 dark:border-stone-800/60 bg-stone-50/80 dark:bg-stone-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-11 items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400 min-w-0 overflow-hidden">
            <Activity className="w-4 h-4 shrink-0 text-brand-600" />
            <span className="truncate">
              {t(
                "Latest: Discussions in Siasa · Tech & Gadgets · TzCheck",
                "Hivi karibuni: Midahalo katika Siasa · Tech & Gadgets · TzCheck"
              )}
            </span>
          </div>
          <button
            type="button"
            onClick={handleStartDiscussion}
            className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {t("Start a discussion", "Anzisha mjadala")}
          </button>
        </div>
      </div>
    </div>
  );
}
