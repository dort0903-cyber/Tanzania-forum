"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Check, EyeOff, Trash2, Loader2 } from "lucide-react";

export function ModerationActions({
  postId,
  currentStatus,
}: {
  postId: string;
  currentStatus: string;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const act = async (action: "approve" | "hide" | "delete") => {
    setLoading(action);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let status = currentStatus;
    if (action === "approve") {
      status = "published";
      await supabase
        .from("posts")
        .update({
          status: "published",
          is_ai_flagged: false,
          ai_flag_reason: null,
        })
        .eq("id", postId);
    } else if (action === "hide") {
      status = "hidden";
      await supabase
        .from("posts")
        .update({ status: "hidden" })
        .eq("id", postId);
    } else if (action === "delete") {
      status = "deleted";
      await supabase
        .from("posts")
        .update({ status: "deleted" })
        .eq("id", postId);
    }

    if (user) {
      await supabase.from("audit_logs").insert({
        actor_id: user.id,
        action: `moderation_${action}`,
        entity_type: "post",
        entity_id: postId,
        metadata: { previous_status: currentStatus, new_status: status },
      });
    }

    setLoading(null);
    router.refresh();
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => act("approve")}
        disabled={!!loading}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/40 hover:bg-green-100 dark:hover:bg-green-950/60 rounded-lg disabled:opacity-50"
      >
        {loading === "approve" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Check className="w-3.5 h-3.5" />
        )}
        Approve
      </button>
      <button
        onClick={() => act("hide")}
        disabled={!!loading}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-950/60 rounded-lg disabled:opacity-50"
      >
        {loading === "hide" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <EyeOff className="w-3.5 h-3.5" />
        )}
        Hide
      </button>
      <button
        onClick={() => act("delete")}
        disabled={!!loading}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/60 rounded-lg disabled:opacity-50"
      >
        {loading === "delete" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Trash2 className="w-3.5 h-3.5" />
        )}
        Delete
      </button>
    </div>
  );
}
