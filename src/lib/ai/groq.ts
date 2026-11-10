const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function generateThreadSummary(
  title: string,
  posts: { body: string; author?: string }[],
  language: "en" | "sw" = "en"
): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

  if (!apiKey) {
    console.error("GROQ_API_KEY is not set");
    return null;
  }

  const postsText = posts
    .slice(0, 30) // limit context
    .map((p, i) => `[${i + 1}] ${p.author || "User"}: ${p.body.slice(0, 400)}`)
    .join("\n\n");

  const systemPrompt =
    language === "sw"
      ? `Wewe ni msaidizi wa muhtasari wa majadiliano. Andika muhtasari mfupi (sekunde 30 kusoma) wa mjadala huu kwa Kiswahili. Lenga pointi kuu, maoni tofauti, na hitimisho. Usiongeze maoni yako mwenyewe. Tumia lugha rahisi na wazi.`
      : `You are a discussion summarizer. Write a concise 30-second-read summary of this forum thread in English. Focus on key points, differing opinions, and any conclusions. Do not add your own opinions. Use clear, neutral language.`;

  const userPrompt = `Thread title: ${title}\n\nPosts:\n${postsText}`;

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
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 400,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Groq API error:", res.status, err);
      return null;
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (e) {
    console.error("Groq request failed:", e);
    return null;
  }
}

export async function moderateContent(
  text: string
): Promise<{ flagged: boolean; reason?: string; confidence?: number }> {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

  if (!apiKey) return { flagged: false };

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
            content: `You are a content moderator for a Tanzanian community forum. Analyze the text for hate speech, harassment, spam, severe misinformation, or illegal content. Respond ONLY with valid JSON: {"flagged": boolean, "reason": string or null, "confidence": number between 0 and 1}. Be reasonably lenient for political discussion and strong opinions.`,
          },
          { role: "user", content: text.slice(0, 1500) },
        ],
        temperature: 0.1,
        max_tokens: 150,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) return { flagged: false };

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return { flagged: false };

    const parsed = JSON.parse(content);
    return {
      flagged: !!parsed.flagged,
      reason: parsed.reason || undefined,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : undefined,
    };
  } catch {
    return { flagged: false };
  }
}
