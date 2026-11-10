"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types/database";

const ROLES: UserRole[] = ["admin", "moderator", "fact_checker", "member"];

export function UserRoleSelect({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: UserRole;
}) {
  const [role, setRole] = useState(currentRole);
  const [saving, setSaving] = useState(false);

  const handleChange = async (newRole: UserRole) => {
    if (newRole === role) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (!error) {
      setRole(newRole);
      // Audit
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("audit_logs").insert({
          actor_id: user.id,
          action: "change_user_role",
          entity_type: "profile",
          entity_id: userId,
          metadata: { from: role, to: newRole },
        });
      }
    }
    setSaving(false);
  };

  return (
    <select
      value={role}
      onChange={(e) => handleChange(e.target.value as UserRole)}
      disabled={saving}
      className="rounded-md border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-2 py-1 text-xs capitalize focus:outline-none focus:ring-1 focus:ring-brand-500"
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {r.replace("_", " ")}
        </option>
      ))}
    </select>
  );
}
