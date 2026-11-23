import { readFileSync } from "node:fs";
import { join } from "node:path";

// Fallback order: your override, then current flash models. Retired or busy models are skipped.
const MODELS = () => [...new Set([process.env.GEMINI_MODEL, "gemini-2.5-flash", "gemini-3.8-flash", "gemini-flash-latest", "gemini-3.5-flash", "gemini-3-flash-preview", "gemini-2.5-flash-lite"].filter(Boolean))];

export default async function ai(request, response) {
  response.setHeader("Cache-Control", "no-store");
  if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed" });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return response.status(503).json({ error: "AI tutor unavailable: add GEMINI_API_KEY in Vercel Environment Variables and redeploy." });

  try {
    const body = typeof request.body === "string" ? JSON.parse(request.body || "{}") : (request.body || {});
    const messages = Array.isArray(body.messages) ? body.messages.slice(-16) : [];
    if (!messages.length || messages[0].role !== "user") return response.status(400).json({ error: "messages must start with a user turn" });

    const contents = messages.map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: String(message.content || "") }],
    }));
    let instructions = "";
    try { instructions = readFileSync(join(process.cwd(), "tutor-instructions.md"), "utf8").replace(/<!--[\s\S]*?-->/g, "").trim(); } catch {}
    const system = [
      instructions || "You are Jarvis, a patient Socratic tutor for CSE 2205 Data Structures and Algorithms II. Teach in the student's language, one guiding question at a time, and trace algorithms step by step.",
      `## এই মুহূর্তের প্রসঙ্গ (app context)\n${String(body.system || "(none)")}`,
    ].join("\n\n");
    const payload = JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents,
      generationConfig: { temperature: 0.6, maxOutputTokens: Math.min(Math.max(Number(body.max_tokens) || 2000, 1024), 8000) },
    });
    // Try each model in turn: a model can be retired for new keys, overloaded (503) or rate-limited (429).
    let last = { status: 502, error: "Gemini request failed." };
    const started = Date.now();
    for (const model of MODELS()) {
      if (Date.now() - started > 45000) break;
      const result = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key }, body: payload, signal: AbortSignal.timeout(30000),
      }).catch((e) => ({ ok: false, status: 504, json: async () => ({ error: { message: e.name === "TimeoutError" ? "Gemini request timed out." : String(e.message) } }) }));
      const data = await result.json().catch(() => ({}));
      if (result.ok) {
        const text = (data.candidates?.[0]?.content?.parts || []).filter((part) => !part.thought).map((part) => part.text || "").join("").trim();
        if (text) return response.status(200).json({ text, provider: "gemini", model });
        last = { status: 502, error: "Gemini returned an empty response." };
        continue;
      }
      const msg = data.error?.message || `Gemini request failed (${result.status})`;
      if (result.status === 401 || (result.status === 403 && /api key|permission/i.test(msg) && !/model/i.test(msg))) return response.status(503).json({ error: "Gemini rejected the configured API key." });
      last = { status: [429, 503].includes(result.status) ? 503 : 502, error: msg };
    }
    return response.status(last.status).json({ error: last.error });
  } catch (error) {
    const status = error.name === "TimeoutError" || error.name === "AbortError" ? 504 : 500;
    return response.status(status).json({ error: status === 504 ? "Gemini request timed out." : "AI tutor request failed." });
  }
}
