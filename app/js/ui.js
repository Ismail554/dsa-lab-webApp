// Shared UI helpers: DOM builder, math rendering, markdown-lite, i18n, toasts.
import { store } from "./store.js";

// Null-safe DOM: conditional children (cond ? el : null) must never render as the text "null".
for (const m of ["append", "replaceChildren", "prepend"]) {
  const orig = Element.prototype[m];
  Element.prototype[m] = function (...nodes) { return orig.apply(this, nodes.filter((n) => n != null && n !== false)); };
}

/** h("div.card#id", {attrs/on*}, ...children) */
export function h(sel, attrs, ...kids) {
  if (attrs == null || typeof attrs !== "object" || attrs instanceof Node || Array.isArray(attrs)) { if (attrs != null) kids.unshift(attrs); attrs = {}; }
  const m = sel.match(/^([a-z0-9-]+)?((?:[.#][\w-]+)*)$/i);
  const el = document.createElement((m && m[1]) || "div");
  if (m && m[2]) for (const part of m[2].match(/[.#][\w-]+/g)) part[0] === "." ? el.classList.add(part.slice(1)) : (el.id = part.slice(1));
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === "html") el.innerHTML = v;
    else if (k === "class") el.className += " " + v;
    else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
    else if (k === "dataset") Object.assign(el.dataset, v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  append(el, kids);
  return el;
}
function append(el, kids) {
  for (const k of kids.flat(Infinity)) { if (k == null || k === false) continue; el.append(k instanceof Node ? k : document.createTextNode(String(k))); }
}
export const clear = (el) => { while (el.firstChild) el.firstChild.remove(); return el; };

// ---------- i18n ----------
export const lang = () => store.state.lang || "en";
/** Pick the right language from {en, bn} objects (falls back to English). */
export function L(v) { if (v == null) return ""; if (typeof v === "string") return v; return v[lang()] ?? v.en ?? v.bn ?? ""; }

const UI = {
  home: ["Home", "হোম"], learn: ["Learn", "শিখি"], labs: ["Labs", "ল্যাব"], practice: ["Practice", "অনুশীলন"],
  exam: ["Mock Test", "মক টেস্ট"], revise: ["Smart Revision", "স্মার্ট রিভিশন"], progress: ["Progress & Map", "অগ্রগতি ও ম্যাপ"],
  library: ["Library & Upload", "লাইব্রেরি ও আপলোড"], formulas: ["Formula Cards", "ফর্মুলা কার্ড"],
  next: ["Next", "পরের ধাপ"], back: ["Back", "আগের ধাপ"], check: ["Check", "চেক করো"], hint: ["Hint", "হিন্ট"],
  reveal: ["Show solution", "সমাধান দেখাও"], step: ["Step", "ধাপ"], of: ["of", "/"], keyIdea: ["Key idea", "মূল ধারণা"],
  youlearn: ["You'll learn", "যা শিখবে"], inLesson: ["In this lesson", "এই লেসনে"], correct: ["Correct!", "সঠিক!"],
  wrong: ["Not quite.", "পুরোপুরি ঠিক হয়নি।"], tryAgain: ["Try again", "আবার চেষ্টা করো"], explainBack: ["Explain it back", "নিজের ভাষায় বোঝাও"],
  search: ["Search topics, labs, questions…", "টপিক, ল্যাব, প্রশ্ন খুঁজুন…"], start: ["Start", "শুরু করো"], continue: ["Continue", "চালিয়ে যাও"],
  mastery: ["Mastery", "দক্ষতা"], weak: ["Weak topics", "দুর্বল টপিক"], askJarvis: ["Ask Jarvis", "Jarvis-কে জিজ্ঞেস করো"],
};
export function T(key) { const v = UI[key]; if (!v) return key; return lang() === "bn" ? v[1] : v[0]; }

// ---------- Math rendering ----------
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export function texHTML(src, display = false) {
  if (!window.katex) return esc(src);
  try { return window.katex.renderToString(src, { displayMode: display, throwOnError: false, strict: "ignore", trust: false }); }
  catch { return esc(src); }
}
/** Text with $inline$ / $$display$$ math and **bold**, `code`, _em_. */
export function richInline(text) {
  if (/```/.test(text)) return String(text).split(/```[a-z]*\n?([\s\S]*?)```/).map((seg, k) => (k % 2 ? `<pre class="code">${esc(seg.replace(/\n$/, ""))}</pre>` : richInline(seg.replace(/^\n+|\n+$/g, "")))).join("");
  const parts = []; const re = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$|\\\(([\s\S]+?)\\\)|\\\[([\s\S]+?)\\\]/g; let last = 0, m;
  while ((m = re.exec(text))) {
    parts.push(fmtText(text.slice(last, m.index)));
    const disp = m[1] ?? m[4]; parts.push(disp != null ? `<div class="mathblock">${texHTML(disp, true)}</div>` : texHTML(m[2] ?? m[3]));
    last = re.lastIndex;
  }
  parts.push(fmtText(text.slice(last)));
  return parts.join("");
}
function fmtText(s) {
  return esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/(^|[\s(])_([^_\n]+)_(?=[\s.,;:!?)]|$)/g, "$1<em>$2</em>").replace(/\n/g, "<br>");
}
/** Element containing rich (math) text. */
export function rich(text, tag = "div", cls = "") { const el = document.createElement(tag); if (cls) el.className = cls; el.innerHTML = richInline(L(text)); return el; }
export function math(src, display = false) { const el = document.createElement(display ? "div" : "span"); el.className = display ? "mathblock" : "mathinline"; el.innerHTML = texHTML(src, display); return el; }

/** Minimal markdown → HTML (headings, lists, tables, quotes, code, paragraphs, math). */
export function markdown(md) {
  const lines = String(md).replace(/\r/g, "").split("\n"); const out = []; let i = 0;
  const para = []; const flush = () => { if (para.length) { out.push(`<p>${richInline(para.join("\n"))}</p>`); para.length = 0; } };
  while (i < lines.length) {
    const ln = lines[i];
    if (/^\s*\$\$/.test(ln)) { flush(); const buf = [ln]; if (!/\$\$.*\$\$/.test(ln.trim().slice(2)) && !(ln.trim().length > 2 && ln.trim().endsWith("$$"))) { while (++i < lines.length) { buf.push(lines[i]); if (lines[i].includes("$$")) break; } } out.push(richInline(buf.join("\n"))); i++; continue; }
    if (/^```/.test(ln)) { flush(); const buf = []; while (++i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i]); out.push(`<pre>${esc(buf.join("\n"))}</pre>`); i++; continue; }
    const hm = ln.match(/^(#{1,6})\s+(.*)$/); if (hm) { flush(); const lv = Math.min(hm[1].length + 1, 6); out.push(`<h${lv}>${richInline(hm[2])}</h${lv}>`); i++; continue; }
    if (/^\s*---+\s*$/.test(ln)) { flush(); out.push("<hr>"); i++; continue; }
    if (/^\s*>/.test(ln)) { flush(); const buf = []; while (i < lines.length && /^\s*>/.test(lines[i])) buf.push(lines[i++].replace(/^\s*>\s?/, "")); out.push(`<blockquote>${richInline(buf.join("\n"))}</blockquote>`); continue; }
    if (/^\s*\|.*\|\s*$/.test(ln)) { flush(); const rows = []; while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) rows.push(lines[i++]); const cells = rows.filter((r) => !/^\s*\|[\s:|-]+\|\s*$/.test(r)).map((r) => r.trim().slice(1, -1).split("|").map((c) => richInline(c.trim()))); out.push(`<table>${cells.map((r, k) => `<tr>${r.map((c) => (k === 0 ? `<th>${c}</th>` : `<td>${c}</td>`)).join("")}</tr>`).join("")}</table>`); continue; }
    if (/^\s*([-*•]|\d+[.)])\s+/.test(ln)) { flush(); const ordered = /^\s*\d/.test(ln); const buf = []; while (i < lines.length && /^\s*([-*•]|\d+[.)])\s+/.test(lines[i])) buf.push(lines[i++].replace(/^\s*([-*•]|\d+[.)])\s+/, "")); out.push(`<${ordered ? "ol" : "ul"}>${buf.map((b) => `<li>${richInline(b)}</li>`).join("")}</${ordered ? "ol" : "ul"}>`); continue; }
    if (!ln.trim()) { flush(); i++; continue; }
    para.push(ln.trim()); i++;
  }
  flush(); return out.join("\n");
}

// ---------- Feedback ----------
export function toast(msg, kind = "info", ms = 2600) {
  let host = document.getElementById("toasts"); if (!host) { host = h("div#toasts"); document.body.append(host); }
  const el = h(`div.toast.${kind}`, { html: richInline(L(msg)) }); host.append(el);
  setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 400); }, ms);
}
export function confetti(target = document.body) {
  const host = h("div.confetti"); target.append(host);
  const colors = ["var(--green-3)", "var(--rust)", "var(--violet-ink)", "var(--gold)", "var(--sky)"];
  for (let k = 0; k < 36; k++) host.append(h("i", { style: { left: `${Math.random() * 100}%`, background: colors[k % colors.length], animationDelay: `${Math.random() * 0.3}s`, transform: `rotate(${Math.random() * 360}deg)` } }));
  setTimeout(() => host.remove(), 1600);
}

export function pill(text, kind = "") { return h(`span.pill${kind ? "." + kind : ""}`, text); }
export function icon(name) { return h("span.ico", { "aria-hidden": "true", html: ICONS[name] || "" }); }
const I = (d) => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
export const ICONS = {
  menu: I('<path d="M4 6h16M4 12h16M4 18h16"/>'), home: I('<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>'),
  book: I('<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>'), flask: I('<path d="M9 3h6M10 3v6L4.5 18.5A2 2 0 0 0 6.2 21.5h11.6a2 2 0 0 0 1.7-3L14 9V3"/><path d="M7 15h10"/>'),
  pen: I('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'), clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  repeat: I('<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>'),
  map: I('<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="8" r="2.5"/><circle cx="9" cy="18" r="2.5"/><path d="M8.2 7.2l7.6.6M7 8.3l1.6 7.3M16.5 10l-5.7 6.4"/>'),
  upload: I('<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>'), cards: I('<rect x="3" y="6" width="14" height="14" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v12"/>'),
  search: I('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'), moon: I('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'),
  sun: I('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  chat: I('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>'), play: I('<path d="M7 4l13 8-13 8z"/>'), pause: I('<path d="M7 4h3v16H7zM14 4h3v16h-3z"/>'),
  replay: I('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>'), check: I('<path d="M5 12.5l4.5 4.5L19 7"/>'), x: I('<path d="M6 6l12 12M18 6L6 18"/>'),
  bulb: I('<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>'), spark: I('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>'),
  arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>'), left: I('<path d="M19 12H5M11 6l-6 6 6 6"/>'), target: I('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'),
  trash: I('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'), file: I('<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5"/>'),
  globe: I('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'), flame: I('<path d="M12 22a7 7 0 0 0 7-7c0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-2 2-5 5-5 8a7 7 0 0 0 7 7z"/>'),
};

export function debounce(fn, ms = 200) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
export const fmtDate = (ts) => new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
