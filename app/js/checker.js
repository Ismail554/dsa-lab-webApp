// Answer evaluation for DSA: numbers, complexity classes (Big-O/Θ), sequences/arrays, short text, theory rubrics, Feynman.
import { num, growth, cmpGrowth, growthTex } from "./dsa.js";

const squash = (s) => String(s ?? "").toLowerCase().replace(/[\s"'`]+/g, "").replace(/[‐-―−]/g, "-");
const stripLabel = (s) => String(s ?? "").trim().replace(/^\s*[a-zA-Z][\w\s()\[\],]{0,24}?=\s*(?=[^=]+$)/, "");

/** Which kind of answer a field expects. */
export function kindOf(f) {
  if (f.kind) return f.kind;
  const a = String(f.ans);
  if (/^\s*\[/.test(a) || /,/.test(a)) return "seq";
  if (/n|log/i.test(a) && !/^[\d\s+*/().^-]+$/.test(a)) return "bigo";
  if (num(a) !== null) return "num";
  return "text";
}
/** Split "[1, 2, 3]" / "1 2 3" / "A → B → C" / "A B C" into tokens. */
export function tokens(s) {
  const t = String(s ?? "").replace(/[\[\]{}()]/g, " ").replace(/->|→|⇒|=>|,|;|\|/g, " ").trim();
  if (!t) return [];
  const parts = t.split(/\s+/).filter(Boolean);
  // "ABCD" typed without separators for single-letter vertices
  if (parts.length === 1 && /^[A-Za-z]{2,10}$/.test(parts[0]) && parts[0] === parts[0].toUpperCase()) return parts[0].split("");
  return parts;
}
const tokEq = (a, b) => { const x = num(a), y = num(b); if (x !== null && y !== null && /^[-\d.]+$/.test(a) && /^[-\d.]+$/.test(b)) return Math.abs(x - y) < 1e-6; return a.toLowerCase() === b.toLowerCase(); };

/** Check one answer field. Returns { ok, msg } */
export function checkField(field, raw) {
  const input = String(raw ?? "").trim();
  if (!input) return { ok: false, msg: "empty" };
  const targets = [field.ans, ...(field.alt || [])];
  if (targets.some((t) => squash(t) === squash(input) || squash(t) === squash(stripLabel(input)))) return { ok: true };
  const kind = kindOf(field);
  if (kind === "seq" || kind === "set") {
    const got = tokens(stripLabel(input));
    for (const t of targets) {
      const want = tokens(t);
      if (kind === "set") { const A = [...got].map((x) => x.toLowerCase()).sort(), B = [...want].map((x) => x.toLowerCase()).sort(); if (A.length === B.length && A.every((x, k) => x === B[k])) return { ok: true }; }
      else if (got.length === want.length && got.every((x, k) => tokEq(x, want[k]))) return { ok: true };
    }
    const want = tokens(field.ans);
    if (got.length !== want.length) return { ok: false, msg: `Expected ${want.length} items, you gave ${got.length}.` };
    if (kind === "seq" && [...got].map((x) => x.toLowerCase()).sort().join() === [...want].map((x) => x.toLowerCase()).sort().join()) return { ok: false, msg: "Right items, wrong order." };
    return { ok: false };
  }
  if (kind === "bigo") {
    const g = growth(input); if (!g) return { ok: false, msg: "Could not read that — try forms like n log n, n^2, 2^n, log n, n/log n, n^1.58." };
    for (const t of targets) { const w = growth(t); if (!w) continue; if ((w.c !== null && g.c !== null) || (w.c === null && g.c === null && cmpGrowth(g, w) === 0)) return { ok: true }; }
    const w = growth(field.ans); if (!w) return { ok: false };
    if (w.c !== null || g.c !== null) return { ok: false, msg: g.c !== null ? "That is constant time — does the work really not grow with n?" : "Hint: constant work is written Θ(1)." };
    const c = cmpGrowth(g, w);
    return { ok: false, msg: c > 0 ? "Too big — that grows faster than the true bound." : "Too small — the true bound grows faster." };
  }
  if (kind === "text") {
    const s = squash(stripLabel(input));
    return { ok: targets.some((t) => squash(t) === s) };
  }
  const got = num(stripLabel(input)); const want = num(field.ans);
  if (got === null) return { ok: false, msg: "Could not read that number — try 15, 3/4, log2(8), floor(7/2)." };
  if (want === null) return { ok: false };
  if (Math.abs(got - want) <= 1e-6 * Math.max(1, Math.abs(want)) || (field.tol && Math.abs(got - want) <= field.tol)) return { ok: true };
  if (Math.abs(got - want) === 1) return { ok: false, msg: "Off by one — check 0-based vs 1-based, or edges vs nodes." };
  return { ok: false };
}
export function checkFields(fields, values) {
  const res = fields.map((f, k) => checkField(f, values[k]));
  return { ok: res.every((r) => r.ok), res };
}
/** Live preview for an answer box. */
export function previewOf(f, raw) {
  const v = String(raw ?? "").trim(); if (!v) return "";
  const k = kindOf(f);
  if (k === "bigo") { const g = growth(v); return g ? { tex: `\\Theta(${growthTex(g)})` } : ""; }
  if (k === "seq" || k === "set") { const t = tokens(stripLabel(v)); return t.length ? { text: `${t.length} item${t.length > 1 ? "s" : ""}: ${t.join(" · ")}` } : ""; }
  if (k === "num") { const n = num(stripLabel(v)); return n === null ? "" : { tex: `= ${+n.toFixed(4)}` }; }
  return "";
}
/** Example placeholder text per kind. */
export function placeholderOf(f) {
  return { bigo: "e.g. n log n, n^2, log n, 2^n", seq: "e.g. 90, 50, 70  or  A B C", set: "e.g. A, C, D (any order)", num: "e.g. 15, log2(8), floor(7/2)", text: "short answer" }[kindOf(f)];
}
/** Answer as display text. */
export function showAns(f) { return f.show || f.ans; }

/** Keyword-group rubric. groups: array of arrays of alternatives. */
export function rubric(text, groups) {
  const t = " " + String(text).toLowerCase().replace(/\s+/g, " ") + " ";
  const tn = t.replace(/\s/g, "");
  const hit = groups.map((alts) => alts.some((a) => { const x = a.toLowerCase(); return t.includes(x) || tn.includes(x.replace(/\s/g, "")); }));
  return { hit, score: groups.length ? hit.filter(Boolean).length / groups.length : 0 };
}

/** Feynman-technique evaluation: coverage + clarity signals. */
export function feynmanScore(text, keywords) {
  const words = String(text).trim().split(/\s+/).filter(Boolean);
  const r = rubric(text, keywords);
  const hasExample = /\d|উদাহরণ|example|e\.g|যেমন/i.test(text);
  const hasAnalogy = /like|imagine|think of|as if|similar|ধরো|ভাবো|মতো|মত |যেন/i.test(text);
  const sentences = String(text).split(/[.!?।]+/).filter((s) => s.trim().length > 3);
  const avgLen = words.length / Math.max(1, sentences.length);
  const lengthScore = Math.min(1, words.length / 45);
  const clarity = avgLen < 28 ? 1 : avgLen < 40 ? 0.7 : 0.4;
  const score = Math.round(100 * (0.55 * r.score + 0.15 * lengthScore + 0.1 * clarity + 0.1 * (hasExample ? 1 : 0) + 0.1 * (hasAnalogy ? 1 : 0)));
  return { score, coverage: r, hasExample, hasAnalogy, words: words.length, avgLen };
}
