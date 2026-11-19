export default function status(_request, response) {
  const ai = Boolean(process.env.GEMINI_API_KEY);
  response.setHeader("Cache-Control", "no-store");
  return response.status(200).json({ ok: true, ai, provider: ai ? "gemini" : null, model: process.env.GEMINI_MODEL || "gemini-2.5-flash" });
}
