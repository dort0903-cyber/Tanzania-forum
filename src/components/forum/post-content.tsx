"use client";

/**
 * Renders stored post HTML safely with allowed tags only.
 * Styles match the rich-text editor output.
 */
function sanitizeHtml(html: string): string {
  if (!html) return "";

  // If plain text (no tags), escape and preserve line breaks
  if (!/<[a-z][\s\S]*>/i.test(html)) {
    return html
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br />");
  }

  // Allow only safe formatting tags
  const allowed =
    /<\/?(?:b|strong|i|em|u|p|br|ul|ol|li|h[1-4]|blockquote|div|span)(?:\s[^>]*)?>/gi;

  let out = html
    // strip scripts/styles/events
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, "")
    .replace(/\s(href|src)\s*=\s*(['"])javascript:.*?\2/gi, "");

  // Remove disallowed tags but keep inner text
  out = out.replace(/<\/?([a-z0-9]+)[^>]*>/gi, (match, tag) => {
    if (allowed.test(match)) {
      allowed.lastIndex = 0;
      // Keep only style="text-align:..." for justify
      if (/style=/i.test(match)) {
        const align = match.match(/text-align\s*:\s*(left|center|right|justify)/i);
        if (align) {
          return `<${tag.toLowerCase()} style="text-align:${align[1].toLowerCase()}">`;
        }
        return `<${tag.toLowerCase()}>`;
      }
      return match.replace(/\s(on\w+|href|src)\s*=\s*("[^"]*"|'[^']*')/gi, "");
    }
    return "";
  });

  return out;
}

export function PostContent({ html }: { html: string }) {
  const safe = sanitizeHtml(html || "");

  return (
    <div
      className="post-content prose-forum mt-2 text-sm text-stone-800 dark:text-stone-200 leading-relaxed"
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
