import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function MePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?auth=required");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("handle")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.handle) {
    redirect(`/u/${profile.handle}`);
  }

  redirect("/");
}
