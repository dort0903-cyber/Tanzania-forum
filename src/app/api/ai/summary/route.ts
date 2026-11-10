import { createClient } from "@/lib/supabase/server";
import { generateThreadSummary } from "@/lib/ai/groq";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { threadId, title, language } = await request.json();

    if (!threadId || !title) {
      return NextResponse.json(
        { error: "threadId and title are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Optional: require auth for generating (or allow public for now)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Fetch posts for context
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select(
        `
        body,
        author:profiles(handle, display_name)
      `
      )
      .eq("thread_id", threadId)
      .eq("status", "published")
      .order("created_at", { ascending: true })
      .limit(40);

    if (postsError) {
      return NextResponse.json({ error: postsError.message }, { status: 500 });
    }

    const formatted = (posts || []).map((p: any) => ({
      body: p.body,
      author: p.author?.display_name || p.author?.handle || "User",
    }));

    const summary = await generateThreadSummary(
      title,
      formatted,
      language === "sw" ? "sw" : "en"
    );

    if (!summary) {
      return NextResponse.json(
        { error: "Failed to generate summary. Check Groq API key." },
        { status: 502 }
      );
    }

    // Save to thread
    const { error: updateError } = await supabase
      .from("threads")
      .update({
        ai_summary: summary,
        ai_summary_generated_at: new Date().toISOString(),
      })
      .eq("id", threadId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Audit (if user present)
    if (user) {
      await supabase.from("audit_logs").insert({
        actor_id: user.id,
        action: "generate_ai_summary",
        entity_type: "thread",
        entity_id: threadId,
        metadata: { model: process.env.GROQ_MODEL },
      });
    }

    return NextResponse.json({ summary });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
