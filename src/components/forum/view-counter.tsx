"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Increments view_count once per browser session for a thread.
 * Does NOT call router.refresh() — avoids layout shake / secondary bar reload.
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
      // sessionStorage unavailable — still try once
    }

    const supabase = createClient();
    // Fire-and-forget; never refresh the page
    void supabase
      .from("threads")
      .update({ view_count: initialCount + 1 })
      .eq("id", threadId);
  }, [threadId, initialCount]);

  return null;
}
