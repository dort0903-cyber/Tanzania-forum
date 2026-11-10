import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const TOPICS = [
  "bei ya chakula na maisha ya kila siku Tanzania",
  "elimu na shule za serikali",
  "ajira kwa vijana",
  "kilimo na soko la mazao",
  "usafiri wa umma Dar es Salaam",
  "teknolojia na simu mahiri",
  "afya ya jamii na hospitali",
  "mazingira na mabadiliko ya tabianchi",
  "siasa za ndani bila chuki",
  "biashara ndogo na ujasiriamali",
  "utamaduni na lugha ya Kiswahili",
  "mpira wa miguu na michezo",
];

function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\|.*\|/g, "")
    .replace(/^\s*>\s+/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "mjadala"
  );
}

async function generateSwahiliPost(
  topic: string
): Promise<{ title: string; body: string } | null> {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
  if (!apiKey) {
    console.error("GROQ_API_KEY missing");
    return null;
  }

  try {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "Wewe ni mwanajamii wa jukwaa la Tanzania. Andika mjadala mfupi kwa Kiswahili sanifu, rahisi, na wa heshima. TOA JIBU kwa muundo huu tu (bila markdown, bila #, bila *, bila jedwali):\nKichwa: ...\nMwili: ...\nMwili uwe aya 2 au 3 tu. Usitumie alama za markdown kabisa.",
          },
          {
            role: "user",
            content: `Andika mjadala mpya kuhusu: ${topic}`,
          },
        ],
        temperature: 0.85,
        max_tokens: 500,
      }),
    });

    if (!res.ok) {
      console.error("Groq error", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    let content = data.choices?.[0]?.message?.content?.trim() || "";
    content = stripMarkdown(content);

    let title = "";
    let body = "";
    const titleMatch = content.match(/Kichwa:\s*(.+)/i);
    const bodyMatch = content.match(/Mwili:\s*([\s\S]+)/i);
    if (titleMatch) title = stripMarkdown(titleMatch[1].trim());
    if (bodyMatch) body = stripMarkdown(bodyMatch[1].trim());

    if (!title || !body) {
      const lines = content.split("\n").filter((l: string) => l.trim());
      title = stripMarkdown(lines[0] || topic).slice(0, 120);
      body = stripMarkdown(lines.slice(1).join("\n") || content);
    }

    if (!title || !body) return null;
    return { title: title.slice(0, 180), body: body.slice(0, 2000) };
  } catch (e) {
    console.error("generateSwahiliPost failed", e);
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const force = searchParams.get("force") === "1";

  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";

  // Allow: Vercel cron, matching CRON_SECRET, or force=1 when no secret is set
  if (cronSecret) {
    const ok =
      isVercelCron ||
      authHeader === `Bearer ${cronSecret}` ||
      searchParams.get("secret") === cronSecret;
    if (!ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Prefer service role so inserts bypass RLS
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return NextResponse.json(
      { error: "Missing NEXT_PUBLIC_SUPABASE_URL or keys" },
      { status: 500 }
    );
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: admin, error: adminErr } = await supabase
    .from("profiles")
    .select("id, handle")
    .eq("role", "admin")
    .limit(1)
    .maybeSingle();

  if (adminErr || !admin) {
    return NextResponse.json(
      {
        error: "No admin user found to attribute AI posts",
        detail: adminErr?.message,
      },
      { status: 400 }
    );
  }

  const { data: categories, error: catErr } = await supabase
    .from("categories")
    .select("id, slug")
    .eq("is_active", true);

  if (catErr || !categories?.length) {
    return NextResponse.json(
      { error: "No categories", detail: catErr?.message },
      { status: 400 }
    );
  }

  // Skip if already posted 5+ today (unless force=1)
  if (!force) {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const { count } = await supabase
      .from("threads")
      .select("*", { count: "exact", head: true })
      .eq("author_id", admin.id)
      .eq("language", "sw")
      .gte("created_at", start.toISOString());
    if ((count ?? 0) >= 5) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        message: "Already created 5 Swahili posts today",
        count,
      });
    }
  }

  const shuffled = [...TOPICS].sort(() => Math.random() - 0.5).slice(0, 5);
  const created: { slug: string; title: string }[] = [];
  const errors: string[] = [];

  for (const topic of shuffled) {
    const generated = await generateSwahiliPost(topic);
    if (!generated) {
      errors.push(`Failed to generate for: ${topic}`);
      continue;
    }

    const cat = categories[Math.floor(Math.random() * categories.length)];
    const slug =
      slugify(generated.title) + "-" + Date.now().toString(36).slice(-5);

    const { data: thread, error: threadErr } = await supabase
      .from("threads")
      .insert({
        category_id: cat.id,
        author_id: admin.id,
        title: generated.title,
        slug,
        language: "sw",
        status: "published",
      })
      .select("id, slug, title")
      .single();

    if (threadErr || !thread) {
      errors.push(threadErr?.message || "thread insert failed");
      continue;
    }

    const { error: postErr } = await supabase.from("posts").insert({
      thread_id: thread.id,
      author_id: admin.id,
      body: generated.body,
      language: "sw",
      status: "published",
    });

    if (postErr) {
      errors.push(postErr.message);
      continue;
    }

    created.push({ slug: thread.slug, title: thread.title });
  }

  return NextResponse.json({
    ok: true,
    created: created.length,
    posts: created,
    errors: errors.length ? errors : undefined,
    author: admin.handle,
  });
}
