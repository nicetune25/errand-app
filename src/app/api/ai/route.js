// src/app/api/ai/route.js
// Server-side proxy for Anthropic API calls.
// The ANTHROPIC_API_KEY never reaches the browser.

export async function POST(request) {
  const { system, message, json_mode } = await request.json();

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 });
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system,
        messages: [{ role: "user", content: message }],
      }),
    });

    const data = await res.json();

    if (data.error) {
      return Response.json({ error: data.error.message }, { status: 400 });
    }

    const text = data.content?.map((b) => b.text || "").join("") || "";

    if (json_mode) {
      try {
        const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
        return Response.json({ result: parsed });
      } catch {
        return Response.json({ error: "Failed to parse JSON response", raw: text }, { status: 422 });
      }
    }

    return Response.json({ result: text });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
