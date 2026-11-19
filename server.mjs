// DSA Lab — zero-config local server.
// Serves the app, vendor libs, course sheets and the `materials/` drop folder,
// and (optionally) proxies AI-tutor requests to Claude using the official SDK.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";

const here = path.dirname(fileURLToPath(import.meta.url));

// Minimal .env loader (keeps API keys out of the code and out of the browser).
try {
  for (const line of fs.readFileSync(path.join(here, ".env"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {}
const PORT = Number(process.env.PORT || 5174);
const APP = path.join(here, "app");
const MATERIALS = path.join(here, "materials");
const COURSE = path.resolve(here, ".."); // folder holding the original .md course sheets
const MODEL = process.env.CLAUDE_MODEL || "claude-opus-5-5";

fs.mkdirSync(MATERIALS, { recursive: true });

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json", ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8", ".tex": "text/plain; charset=utf-8", ".pdf": "application/pdf",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
  ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf", ".ico": "image/x-icon", ".map": "application/json",
};

const VENDOR = {
  "/vendor/katex/": path.join(here, "node_modules/katex/dist"),
  "/vendor/pdfjs/": path.join(here, "node_modules/pdfjs-dist/build"),
};

const STUDY_EXT = new Set([".md", ".markdown", ".txt", ".tex", ".pdf", ".html", ".htm"]);

function send(res, code, body, type = "application/json") {
  res.writeHead(code, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

function safeJoin(root, rel) {
  const p = path.normalize(path.join(root, decodeURIComponent(rel)));
  return p.startsWith(root) ? p : null;
}

function serveFile(res, file) {
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, { error: "not found" });
    res.writeHead(200, { "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-cache" });
    fs.createReadStream(file).pipe(res);
  });
}

function listStudyFiles() {
  const out = [];
  const walk = (dir, base, source) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ent.name.startsWith(".")) continue;
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) { walk(full, path.posix.join(base, ent.name), source); continue; }
      if (!STUDY_EXT.has(path.extname(ent.name).toLowerCase())) continue;
      const st = fs.statSync(full);
      out.push({ name: ent.name, path: path.posix.join(base, ent.name), source, size: st.size, mtime: st.mtimeMs });
    }
  };
  walk(MATERIALS, "", "materials");
  // Original course sheets (top level .md only; raw PDFs are intentionally excluded)
  for (const ent of fs.readdirSync(COURSE, { withFileTypes: true })) {
    if (ent.isFile() && /\.md$/i.test(ent.name)) {
      const st = fs.statSync(path.join(COURSE, ent.name));
      out.push({ name: ent.name, path: ent.name, source: "course", size: st.size, mtime: st.mtimeMs });
    }
  }
  return out;
}

// ---------- Optional AI tutor (Claude) ----------
let client = null;
let aiError = null;
function getClient() {
  if (client) return client;
  try { client = new Anthropic(); aiError = null; } catch (e) { aiError = String(e.message || e); client = null; }
  return client;
}
// Credentials: env vars, or an `ant auth login` profile on disk. A failed auth at call time switches AI off.
const HOME = process.env.USERPROFILE || process.env.HOME || "";
const profileOnDisk = () => [path.join(HOME, ".config", "anthropic"), path.join(process.env.APPDATA || "", "anthropic")].some((p) => p && fs.existsSync(p));
let authFailed = false;
const hasCreds = () => !authFailed && Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_PROFILE || profileOnDisk());

// Custom tutor instructions live in tutor-instructions.md (re-read on every request, so edits apply instantly).
const INSTRUCTIONS = path.join(here, "tutor-instructions.md");
function systemPrompt(extra) {
  let base = "";
  try { base = fs.readFileSync(INSTRUCTIONS, "utf8").replace(/<!--[\s\S]*?-->/g, "").trim(); } catch {}
  return `${base}

## এই মুহূর্তের প্রসঙ্গ (app context)
${extra || "(none)"}`.trim();
}

// ---------- Gemini (Google Generative Language API) ----------
const GEMINI_KEY = () => process.env.GEMINI_API_KEY || "";
const GEMINI_MODELS = [...new Set([process.env.GEMINI_MODEL, "gemini-2.5-flash", "gemini-3-flash-preview"].filter(Boolean))];
let geminiFailed = false;
async function callGemini({ system, messages, max_tokens = 2000, deep = false }) {
  const contents = messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: String(m.content) }] }));
  const body = {
    systemInstruction: { parts: [{ text: systemPrompt(system) }] },
    contents,
    generationConfig: { temperature: 0.6, maxOutputTokens: Math.max(1024, max_tokens) + (deep ? 2048 : 512), thinkingConfig: { thinkingBudget: deep ? 2048 : 256 } },
  };
  let lastErr;
  for (const model of GEMINI_MODELS) {
    const ac = new AbortController(); const timer = setTimeout(() => ac.abort(), 60000);
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST", signal: ac.signal, headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_KEY() }, body: JSON.stringify(body),
      });
      const j = await r.json().catch(() => ({}));
      if (r.status === 401 || r.status === 403) { geminiFailed = true; throw Object.assign(new Error("Gemini key rejected"), { status: 503 }); }
      if (!r.ok) { lastErr = Object.assign(new Error(j.error?.message || `Gemini error ${r.status}`), { status: r.status }); if ([400, 404, 429].includes(r.status) || r.status >= 500) continue; throw lastErr; }
      const cand = j.candidates?.[0];
      const text = (cand?.content?.parts || []).filter((p) => !p.thought).map((p) => p.text || "").join("").trim();
      if (!text) { lastErr = new Error(cand?.finishReason === "SAFETY" ? "দুঃখিত, এই প্রশ্নে সাহায্য করতে পারছি না।" : "Empty reply from Gemini"); continue; }
      return text;
    } catch (e) { if (e.status === 503) throw e; lastErr = e.name === "AbortError" ? new Error("Gemini timed out") : e; }
    finally { clearTimeout(timer); }
  }
  throw lastErr || new Error("Gemini unavailable");
}
const useGemini = () => Boolean(GEMINI_KEY()) && !geminiFailed;
const provider = () => (useGemini() ? "gemini" : hasCreds() ? "claude" : null);

async function callClaude({ system, messages, effort = "low", max_tokens = 2000 }) {
  const c = getClient();
  if (!c) throw Object.assign(new Error(aiError || "No Anthropic credentials"), { status: 503 });
  const response = await c.beta.messages.create({
    model: MODEL,
    max_tokens,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort },
    system: systemPrompt(system),
    messages,
  });
  if (response.stop_reason === "refusal") return "Sorry — I can't help with that request.";
  return response.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
}

async function readBody(req, limit = 8 * 1024 * 1024) {
  const chunks = []; let size = 0;
  for await (const ch of req) { size += ch.length; if (size > limit) throw Object.assign(new Error("payload too large"), { status: 413 }); chunks.push(ch); }
  return Buffer.concat(chunks);
}

async function handleApi(req, res, url) {
  if (url.pathname === "/api/status") {
    const p = provider();
    return send(res, 200, { ok: true, ai: Boolean(p), provider: p, model: p === "gemini" ? GEMINI_MODELS[0] : MODEL, materialsDir: MATERIALS });
  }
  if (url.pathname === "/api/files") return send(res, 200, { files: listStudyFiles() });
  if (url.pathname === "/api/file") {
    const src = url.searchParams.get("source"); const rel = url.searchParams.get("path") || "";
    const root = src === "course" ? COURSE : MATERIALS;
    const file = safeJoin(root, rel);
    if (!file || (src === "course" && path.dirname(file) !== COURSE)) return send(res, 400, { error: "bad path" });
    return serveFile(res, file);
  }
  if (url.pathname === "/api/upload" && req.method === "POST") {
    // Saves an uploaded study file into materials/ so it persists on disk too.
    const name = path.basename(url.searchParams.get("name") || "upload.md").replace(/[^\w.\- ()]/g, "_");
    if (!STUDY_EXT.has(path.extname(name).toLowerCase())) return send(res, 400, { error: "unsupported type" });
    const body = await readBody(req, 40 * 1024 * 1024);
    fs.writeFileSync(path.join(MATERIALS, name), body);
    return send(res, 200, { ok: true, path: name });
  }
  if (url.pathname === "/api/ai" && req.method === "POST") {
    const body = JSON.parse((await readBody(req)).toString("utf8") || "{}");
    const messages = Array.isArray(body.messages) ? body.messages.slice(-16) : [];
    if (!messages.length || messages[0].role !== "user") return send(res, 400, { error: "messages must start with a user turn" });
    try {
      const max_tokens = Math.min(Number(body.max_tokens) || 2000, 8000);
      if (useGemini()) {
        try { return send(res, 200, { text: await callGemini({ system: body.system, messages, max_tokens, deep: body.effort === "medium" }), provider: "gemini" }); }
        catch (e) { if (e.status !== 503 || !hasCreds()) throw e; } // key rejected → fall through to Claude if available
      }
      const text = await callClaude({ system: body.system, messages, effort: body.effort === "medium" ? "medium" : "low", max_tokens: Math.min(Number(body.max_tokens) || 2000, 8000) });
      return send(res, 200, { text });
    } catch (e) {
      if (e.status === 503 && !provider()) return send(res, 503, { error: "AI tutor unavailable — using offline mode" });
      const authProblem = e instanceof Anthropic.AuthenticationError || e.status === 503 || /authenticat|api.?key|credential/i.test(String(e.message));
      if (authProblem) { authFailed = true; return send(res, 503, { error: "AI tutor unavailable (no valid Anthropic credentials) — using offline mode" }); }
      const status = e instanceof Anthropic.RateLimitError ? 429 : e instanceof Anthropic.APIError && e.status ? e.status : 500;
      return send(res, status, { error: String(e.message || e) });
    }
  }
  return send(res, 404, { error: "unknown api" });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.startsWith("/api/")) return await handleApi(req, res, url);
    for (const [prefix, dir] of Object.entries(VENDOR)) {
      if (url.pathname.startsWith(prefix)) { const f = safeJoin(dir, url.pathname.slice(prefix.length)); return f ? serveFile(res, f) : send(res, 400, {}); }
    }
    let rel = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    const file = safeJoin(APP, rel);
    if (!file) return send(res, 400, { error: "bad path" });
    if (!fs.existsSync(file) && !path.extname(rel)) return serveFile(res, path.join(APP, "index.html"));
    return serveFile(res, file);
  } catch (e) {
    send(res, e.status || 500, { error: String(e.message || e) });
  }
});

server.listen(PORT, () => {
  console.log(`\n  DSA Lab running →  http://localhost:${PORT}`);
  console.log(`  Drop new study files into: ${MATERIALS}`);
  const p = provider();
  console.log(`  AI tutor: ${p === "gemini" ? `Gemini (${GEMINI_MODELS[0]})` : p === "claude" ? `Claude (${MODEL})` : "offline mode (add GEMINI_API_KEY to .env to enable)"}`);
  console.log(`  Tutor instructions: ${INSTRUCTIONS}
`);
});
