import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

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
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function generateSwahiliPost(
  topic: string
): Promise<{ title: string; body: string } | null> {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
  if (!apiKey) return null;

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
      temperature: 0.8,
      max_tokens: 500,
    }),
  });

  if (!res.ok) {
    console.error("Groq error", await res.text());
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
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    const isVercelCron = request.headers.get("x-vercel-cron") === "1";
    if (!isVercelCron) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Missing Supabase config" }, { status: 500 });
  }

  const supabase = createClient(url, serviceKey);

  const { data: admin } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .limit(1)
    .maybeSingle();

  if (!admin) {
    return NextResponse.json(
      { error: "No admin user to attribute AI posts" },
      { status: 400 }
    );
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("id, slug")
    .eq("is_active", true);

  if (!categories || categories.length === 0) {
    return NextResponse.json({ error: "No categories" }, { status: 400 });
  }

  const shuffled = [...TOPICS].sort(() => Math.random() - 0.5).slice(0, 5);
  const created: string[] = [];

  for (const topic of shuffled) {
    const generated = await generateSwahiliPost(topic);
    if (!generated) continue;

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
      .select("id, slug")
      .single();

    if (threadErr || !thread) {
      console.error("thread insert", threadErr);
      continue;
    }

    await supabase.from("posts").insert({
      thread_id: thread.id,
      author_id: admin.id,
      body: generated.body,
      language: "sw",
      status: "published",
    });

    created.push(thread.slug);
  }

  return NextResponse.json({
    ok: true,
    created: created.length,
    slugs: created,
  });
}
