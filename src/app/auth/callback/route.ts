import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Google / OAuth provider error
  if (errorParam) {
    console.error("OAuth error:", errorParam, errorDescription);
    return NextResponse.redirect(
      `${origin}/?auth_error=${encodeURIComponent(errorDescription || errorParam)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/?auth_error=missing_code`);
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options as never);
            });
          } catch {
            // ignore
          }
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("exchangeCodeForSession error:", error.message);
    return NextResponse.redirect(
      `${origin}/?auth_error=${encodeURIComponent(error.message)}`
    );
  }

  const user = data.session?.user ?? data.user;
  if (!user) {
    return NextResponse.redirect(`${origin}/?auth_error=no_user`);
  }

  // Ensure profile exists (fallback if DB trigger failed or delayed)
  const { data: existing } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!existing) {
    // Generate simple handle
    const base =
      (user.user_metadata?.full_name as string)?.replace(/\s+/g, "").slice(0, 12) ||
      (user.email?.split("@")[0] ?? "User");
    const handle = `${base}${Math.floor(1000 + Math.random() * 9000)}`.replace(
      /[^a-zA-Z0-9]/g,
      ""
    );

    // Count users to decide admin
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const role = (count ?? 0) === 0 ? "admin" : "member";

    const { error: insertError } = await supabase.from("profiles").insert({
      id: user.id,
      handle,
      display_name: (user.user_metadata?.full_name as string) || handle,
      role,
      google_email: user.email,
      status: "active",
    });

    if (insertError) {
      console.error("Profile insert error:", insertError.message);
      // Continue anyway — user is still authenticated
    } else if (role === "admin") {
      await supabase.from("audit_logs").insert({
        actor_id: user.id,
        action: "bootstrap_admin",
        entity_type: "profile",
        entity_id: user.id,
        metadata: { note: "First user promoted to admin via callback fallback" },
      });
      return NextResponse.redirect(`${origin}/admin`);
    }
  } else if (existing.role === "admin") {
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });
    if ((count ?? 0) === 1) {
      return NextResponse.redirect(`${origin}/admin`);
    }
  }

  // Safe redirect (only relative paths)
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  return NextResponse.redirect(`${origin}${safeNext}`);
}
