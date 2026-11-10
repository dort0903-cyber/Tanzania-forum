"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Increments view_count once per browser session.
 * Never refreshes the page — prevents sticky-bar shake.
 */
export function ViewCounter({
  threadId,
  initialCount,
}: {
  threadId: string;
  initialCount: number;
}) {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current || !threadId) return;
    ran.current = true;

    const key = `tz-viewed-${threadId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // continue once
    }

    const supabase = createClient();
    void supabase
      .from("threads")
      .update({ view_count: (initialCount || 0) + 1 })
      .eq("id", threadId);
  }, [threadId, initialCount]);

  return null;
}
