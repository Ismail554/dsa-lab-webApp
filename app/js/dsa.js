// DSA engine: number/complexity parsing and step-traced algorithms.
// Shared by the labs (visual frames), generators (answers), the tutor and the tests — one source of truth.

// =====================================================================
// Expression parser (real numbers) + asymptotic-growth evaluator
// =====================================================================
const SUBS = "₀₁₂₃₄₅₆₇₈₉";
function prep(src) {
  return String(src)
    .replace(/[₀-₉]/g, (c) => String(SUBS.indexOf(c)))
    .replace(/\\left|\\right|\\,|\\!|\\;|\\cdot|\\times/g, (m) => (m === "\\cdot" || m === "\\times" ? "*" : ""))
    .replace(/\\log/g, "log").replace(/\\lg/g, "lg").replace(/\\sqrt\{([^{}]*)\}/g, "sqrt($1)").replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, "(($1)/($2))")
    .replace(/\\Theta|\\theta|θ|Θ/g, "Θ").replace(/\\Omega|Ω/g, "Ω").replace(/\\omega/g, "ω").replace(/\\phi|φ/g, "phi")
    .replace(/[−–—]/g, "-").replace(/[×·]/g, "*").replace(/÷/g, "/")
    .replace(/²/g, "^2").replace(/³/g, "^3").replace(/⁴/g, "^4").replace(/⁵/g, "^5").replace(/¹/g, "^1").replace(/⁻/g, "^-").replace(/ⁿ/g, "^n")
    .replace(/√\s*\(/g, "sqrt(").replace(/√\s*([0-9.]+|[a-z])/gi, "sqrt($1)")
    .replace(/⌊/g, "floor(").replace(/⌋/g, ")").replace(/⌈/g, "ceil(").replace(/⌉/g, ")")
    .replace(/\*\*/g, "^").replace(/\blg\b/gi, "log")
    .replace(/log_?\{?(\d+(?:\.\d+)?)\}?\s*\(/gi, "logb($1,")
    .replace(/log_?\{?(\d+(?:\.\d+)?)\}?\s+([0-9.]+|[a-z])\b/gi, "logb($1,$2)")
    .replace(/log_\{?(\d+(?:\.\d+)?)\}?([a-z])\b/gi, "logb($1,$2)")
    .replace(/[{}]/g, (c) => (c === "{" ? "(" : ")"))
    .toLowerCase();
}
const FN = ["sqrt", "floor", "ceil", "logb", "log", "ln", "abs", "min", "max", "fact"];
const NAMES = ["sqrt", "floor", "ceil", "logb", "log", "ln", "abs", "min", "max", "phi", "pi", "n", "m", "k", "e", "x", "a", "b", "c", "v", "w"];
function tokenize(s) {
  const out = []; let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9.]/.test(c)) { let j = i; while (j < s.length && /[0-9.]/.test(s[j])) j++; out.push({ t: "num", v: parseFloat(s.slice(i, j)) }); i = j; continue; }
    if (/[a-z_]/.test(c)) {
      let j = i; while (j < s.length && /[a-z_]/.test(s[j])) j++;
      let w = s.slice(i, j); i = j;
      while (w) { const n = NAMES.find((k) => w.startsWith(k)); if (!n) throw new Error(`Unknown name '${w}'`); out.push({ t: "id", v: n }); w = w.slice(n.length); }
      continue;
    }
    if ("+-*/^(),!".includes(c)) { out.push({ t: c }); i++; continue; }
    throw new Error(`Unexpected '${c}'`);
  }
  return out;
}
export function parse(src) {
  const toks = tokenize(prep(src)); let p = 0;
  const peek = () => toks[p]; const eat = (t) => { if (!toks[p] || toks[p].t !== t) throw new Error(`Expected '${t}'`); return toks[p++]; };
  const startsAtom = (tk) => tk && (tk.t === "num" || tk.t === "id" || tk.t === "(");
  function expr() { let n = term(); while (peek() && (peek().t === "+" || peek().t === "-")) { const op = toks[p++].t; n = { op, a: n, b: term() }; } return n; }
  function term() { let n = unary(); while (peek() && (peek().t === "*" || peek().t === "/" || startsAtom(peek()))) { let op = "*"; if (peek().t === "*" || peek().t === "/") op = toks[p++].t; n = { op, a: n, b: unary() }; } return n; }
  function unary() { if (peek() && (peek().t === "-" || peek().t === "+")) { const op = toks[p++].t; const n = unary(); return op === "-" ? { op: "neg", a: n } : n; } return power(); }
  function power() { let base = postfix(); if (peek() && peek().t === "^") { p++; return { op: "^", a: base, b: unary() }; } return base; }
  function postfix() { let n = atom(); while (peek() && peek().t === "!") { p++; n = { fn: "fact", args: [n] }; } return n; }
  function atom() {
    const tk = toks[p++]; if (!tk) throw new Error("Unexpected end");
    if (tk.t === "num") return { num: tk.v };
    if (tk.t === "(") { const n = expr(); eat(")"); return n; }
    if (tk.t === "id") {
      if (FN.includes(tk.v)) {
        let pw = null;
        if (peek() && peek().t === "^") { p++; pw = unary(); } // log^2 n
        let args;
        if (peek() && peek().t === "(") { p++; args = [expr()]; while (peek() && peek().t === ",") { p++; args.push(expr()); } eat(")"); }
        else args = [power()];
        const node = { fn: tk.v, args };
        return pw ? { op: "^", a: node, b: pw } : node;
      }
      return { id: tk.v };
    }
    throw new Error(`Unexpected '${tk.t}'`);
  }
  const tree = expr(); if (p < toks.length) throw new Error(`Unexpected '${toks[p].t}'`);
  return tree;
}
const fact = (x) => { if (x < 0 || x > 170) return NaN; let r = 1; for (let i = 2; i <= Math.round(x); i++) r *= i; return r; };
const NUMF = {
  sqrt: Math.sqrt, floor: Math.floor, ceil: Math.ceil, abs: Math.abs, ln: Math.log, log: Math.log2, fact,
  logb: (b, x) => Math.log(x) / Math.log(b), min: Math.min, max: Math.max,
};
export function evalTree(t, env = {}) {
  if (t.num !== undefined) return t.num;
  if (t.id) { if (env[t.id] !== undefined) return env[t.id]; if (t.id === "pi") return Math.PI; if (t.id === "e") return Math.E; if (t.id === "phi") return (1 + Math.sqrt(5)) / 2; throw new Error(`Unknown variable ${t.id}`); }
  if (t.fn) return NUMF[t.fn](...t.args.map((a) => evalTree(a, env)));
  if (t.op === "neg") return -evalTree(t.a, env);
  const a = evalTree(t.a, env), b = evalTree(t.b, env);
  switch (t.op) { case "+": return a + b; case "-": return a - b; case "*": return a * b; case "/": return a / b; case "^": return Math.pow(a, b); }
  throw new Error("bad node");
}
/** Numeric value of an expression like "log2(8)", "floor((5-1)/2)", "3*2^4", or null. */
export function num(src, env) { try { const v = evalTree(parse(String(src).replace(/^.*=\s*(?=[^=]+$)/, "")), env); return Number.isFinite(v) ? v : null; } catch { return null; } }

// ---- asymptotic growth signatures: g = { F, E, k, p, q, c } ----
//   F: factorial-type (1 = n!, 2 = n^n), E: ln(base) of exponential b^n, k: n^k, p: log^p n, q: (log log n)^q, c: constant value when pure constant
const G = (o = {}) => ({ F: 0, E: 0, k: 0, p: 0, q: 0, c: null, ...o });
const isConst = (g) => g.c !== null;
const gMul = (a, b, s = 1) => (isConst(a) && isConst(b) ? G({ c: s > 0 ? a.c * b.c : a.c / b.c }) : G({ F: a.F + s * b.F, E: a.E + s * b.E, k: a.k + s * b.k, p: a.p + s * b.p, q: a.q + s * b.q }));
const ORDER = ["F", "E", "k", "p", "q"];
export function cmpGrowth(a, b, tol = 2e-3) {
  for (const key of ORDER) { const d = a[key] - b[key]; if (Math.abs(d) > tol) return d > 0 ? 1 : -1; }
  return 0;
}
function growthOf(t) {
  if (t.num !== undefined) return G({ c: t.num });
  if (t.id) { if (t.id === "n" || t.id === "m" || t.id === "v") return G({ k: 1 }); if (t.id === "pi") return G({ c: Math.PI }); if (t.id === "e") return G({ c: Math.E }); if (t.id === "phi") return G({ c: (1 + Math.sqrt(5)) / 2 }); return G({ c: 1 }); }
  if (t.op === "neg") { const g = growthOf(t.a); return isConst(g) ? G({ c: -g.c }) : g; }
  if (t.op === "+" || t.op === "-") { const a = growthOf(t.a), b = growthOf(t.b); if (isConst(a) && isConst(b)) return G({ c: t.op === "+" ? a.c + b.c : a.c - b.c }); if (isConst(a)) return b; if (isConst(b)) return a; return cmpGrowth(a, b) >= 0 ? a : b; }
  if (t.op === "*") return gMul(growthOf(t.a), growthOf(t.b), 1);
  if (t.op === "/") return gMul(growthOf(t.a), growthOf(t.b), -1);
  if (t.op === "^") {
    const a = growthOf(t.a), b = growthOf(t.b);
    if (isConst(b)) { if (isConst(a)) return G({ c: Math.pow(a.c, b.c) }); return G({ F: a.F * b.c, E: a.E * b.c, k: a.k * b.c, p: a.p * b.c, q: a.q * b.c }); }
    if (isConst(a)) { if (a.c <= 1) return G({ c: 1 }); if (b.k === 1 && !b.F && !b.E && !b.p) return G({ E: Math.log(a.c) * (b.c ?? 1) }); if (b.k === 0 && b.p === 1) return G({ k: Math.log2(a.c) }); return G({ E: Math.log(a.c) * Math.max(1, b.k) }); }
    return G({ F: 2 }); // n^n
  }
  if (t.fn) {
    const a = growthOf(t.args[t.fn === "logb" ? 1 : 0]);
    switch (t.fn) {
      case "sqrt": return isConst(a) ? G({ c: Math.sqrt(a.c) }) : gMul(a, G(), 1) && G({ F: a.F / 2, E: a.E / 2, k: a.k / 2, p: a.p / 2, q: a.q / 2 });
      case "log": case "ln": case "logb":
        if (isConst(a)) return G({ c: Math.log2(Math.max(a.c, 1e-9)) });
        if (a.F) return G({ k: 1, p: 1 });
        if (a.E) return G({ k: 1 });
        if (a.k) return G({ p: 1 });
        if (a.p) return G({ q: 1 });
        return G({ c: 1 });
      case "fact": return isConst(a) ? G({ c: fact(a.c) }) : G({ F: 1 });
      case "floor": case "ceil": case "abs": return a;
      case "min": case "max": { const b = growthOf(t.args[1] || t.args[0]); return (cmpGrowth(a, b) >= 0) === (t.fn === "max") ? a : b; }
    }
  }
  return G({ c: 1 });
}
const stripBig = (s) => String(s).trim()
  .replace(/^\s*t\s*\(\s*n\s*\)\s*=\s*/i, "")
  .replace(/^\s*(big[\s-]*)?(o|Θ|Ω|ω|theta|omega)\s*(?=\()/i, "")
  .replace(/^\s*(big[\s-]*)?(\\theta|\\omega|θ|Θ|Ω)\s*(?=\()/i, "");
/** Growth signature of "Θ(n log n)", "n^2 + n", "2^n", "n!", "n/log n" … or null if unreadable. */
export function growth(src) { try { return growthOf(parse(stripBig(prep(src)))); } catch { return null; } }
export function sameGrowth(a, b) { const x = growth(a), y = growth(b); if (!x || !y) return null; if (isConst(x) && isConst(y)) return true; if (isConst(x) || isConst(y)) return false; return cmpGrowth(x, y) === 0; }
/** Pretty TeX for a growth signature. */
export function growthTex(g) {
  if (!g) return "?"; if (isConst(g)) return "1";
  const parts = [];
  if (g.F === 1) parts.push("n!"); else if (g.F === 2) parts.push("n^n");
  if (g.E) parts.push(`${+Math.exp(g.E).toFixed(3)}^n`);
  if (g.k) parts.push(g.k === 1 ? "n" : `n^{${+g.k.toFixed(3)}}`);
  if (g.p > 0) parts.push(g.p === 1 ? "\\log n" : `\\log^{${+g.p.toFixed(3)}} n`);
  if (g.q > 0) parts.push(g.q === 1 ? "\\log\\log n" : `(\\log\\log n)^{${g.q}}`);
  let num = parts.join(" ") || "1"; const den = [];
  if (g.p < 0) den.push(g.p === -1 ? "\\log n" : `\\log^{${+(-g.p).toFixed(3)}} n`);
  if (g.q < 0) den.push("\\log\\log n");
  return den.length ? `\\frac{${num}}{${den.join(" ")}}` : num;
}

// =====================================================================
// Extended Master Theorem   T(n) = a T(n/b) + Θ(n^k log^p n)
// =====================================================================
const near = (x, y) => Math.abs(x - y) < 1e-9;
export function master(a, b, k, p) {
  const bk = Math.pow(b, k); const L = Math.log(a) / Math.log(b);
  const kt = (x) => (near(x, Math.round(x)) ? String(Math.round(x)) : (+x.toFixed(3)).toString());
  const nk = (e) => (near(e, 0) ? "" : near(e, 1) ? "n" : `n^{${kt(e)}}`);
  const lg = (q) => (near(q, 0) ? "" : near(q, 1) ? "\\log n" : `\\log^{${kt(q)}} n`);
  const join = (...xs) => xs.filter(Boolean).join(" ") || "1";
  if (a > bk + 1e-9) return { kase: "1", bk, L, tex: `\\Theta(${nk(L) || "1"})`, ans: `n^(${L})`, why: { en: `a = ${a} > b^k = ${kt(bk)}: the leaves dominate.`, bn: `a = ${a} > b^k = ${kt(bk)}: leaf-এর কাজ বেশি (recursion dominate করে)।` } };
  if (near(a, bk)) {
    if (p > -1 + 1e-9) return { kase: "2.1", bk, L, tex: `\\Theta(${join(nk(k), lg(p + 1))})`, ans: `n^(${k})*log(n)^(${p + 1})`, why: { en: `a = b^k = ${kt(bk)} and p = ${p} > −1: every level does the same work, multiply by one more log.`, bn: `a = b^k = ${kt(bk)} এবং p = ${p} > −1: প্রতিটা level-এ সমান কাজ, তাই আরও একটা log গুণ হয়।` } };
    if (near(p, -1)) return { kase: "2.2", bk, L, tex: `\\Theta(${join(nk(k), "\\log\\log n")})`, ans: `n^(${k})*log(log(n))`, why: { en: `a = b^k and p = −1: the level sums form a harmonic series → log log n.`, bn: `a = b^k এবং p = −1: level-এর যোগফল harmonic series → log log n।` } };
    return { kase: "2.3", bk, L, tex: `\\Theta(${nk(k) || "1"})`, ans: `n^(${k})`, why: { en: `a = b^k and p = ${p} < −1: the log factors add up to a constant.`, bn: `a = b^k এবং p = ${p} < −1: log factor গুলোর যোগফল constant।` } };
  }
  return { kase: "3", bk, L, tex: `\\Theta(${join(nk(k), lg(p)) === "1" ? "1" : p < 0 ? `\\frac{${nk(k) || "1"}}{${lg(-p)}}` : join(nk(k), lg(p))})`, ans: `n^(${k})*log(n)^(${p})`, why: { en: `a = ${a} < b^k = ${kt(bk)}: the root's work dominates.`, bn: `a = ${a} < b^k = ${kt(bk)}: root-এর কাজই সবচেয়ে বেশি।` } };
}

// =====================================================================
// Heaps (array form, 0-based)
// =====================================================================
const better = (type) => (type === "min" ? (x, y) => x < y : (x, y) => x > y);
export const parentIdx = (i, one = false) => (one ? Math.floor(i / 2) : Math.floor((i - 1) / 2));
export const leftIdx = (i, one = false) => (one ? 2 * i : 2 * i + 1);
export const rightIdx = (i, one = false) => (one ? 2 * i + 1 : 2 * i + 2);
const msg = (en, bn) => ({ en, bn: bn || en });

export function isHeap(a, type = "max") {
  const b = better(type);
  for (let i = 1; i < a.length; i++) if (b(a[i], a[parentIdx(i)])) return false;
  return true;
}
export function heapKind(a) { const mx = isHeap(a, "max"), mn = isHeap(a, "min"); return mx && mn ? "both" : mx ? "max" : mn ? "min" : "neither"; }

function siftUp(a, i, type, F) {
  const b = better(type);
  while (i > 0) {
    const p = parentIdx(i);
    F.push({ a: [...a], hl: [i, p], msg: msg(`Compare ${a[i]} (index ${i}) with its parent ${a[p]} (index ${p}).`, `${a[i]} (index ${i}) কে parent ${a[p]} (index ${p}) এর সাথে তুলনা।`) });
    if (!b(a[i], a[p])) { F.push({ a: [...a], hl: [i], ok: [i], msg: msg(`${a[i]} is in place — heap order holds.`, `${a[i]} ঠিক জায়গায় — heap order ঠিক আছে।`) }); return i; }
    [a[i], a[p]] = [a[p], a[i]];
    F.push({ a: [...a], hl: [p], swap: [i, p], msg: msg(`Swap → ${a[p]} moves up to index ${p}.`, `Swap → ${a[p]} উপরে index ${p} এ উঠল।`) });
    i = p;
  }
  F.push({ a: [...a], hl: [0], ok: [0], msg: msg(`${a[0]} reached the root.`, `${a[0]} root এ পৌঁছেছে।`) });
  return 0;
}
function siftDown(a, i, n, type, F) {
  const b = better(type);
  for (;;) {
    const l = 2 * i + 1, r = 2 * i + 2; let best = i;
    if (l < n && b(a[l], a[best])) best = l;
    if (r < n && b(a[r], a[best])) best = r;
    const kids = [l, r].filter((x) => x < n);
    if (!kids.length) { F.push({ a: [...a], hl: [i], ok: [i], n, msg: msg(`${a[i]} is a leaf now — stop.`, `${a[i]} এখন leaf — থামো।`) }); return; }
    F.push({ a: [...a], hl: [i, ...kids], n, msg: msg(`Node ${a[i]} vs children ${kids.map((x) => a[x]).join(", ")} → ${type === "min" ? "smallest" : "largest"} is ${a[best]}.`, `Node ${a[i]} বনাম children ${kids.map((x) => a[x]).join(", ")} → ${type === "min" ? "সবচেয়ে ছোট" : "সবচেয়ে বড়"} ${a[best]}।`) });
    if (best === i) { F.push({ a: [...a], hl: [i], ok: [i], n, msg: msg(`${a[i]} already beats its children — stop.`, `${a[i]} তার children এর চেয়ে ${type === "min" ? "ছোট" : "বড়"} — থামো।`) }); return; }
    [a[i], a[best]] = [a[best], a[i]];
    F.push({ a: [...a], hl: [best], swap: [i, best], n, msg: msg(`Swap ${a[best]} down to index ${best}.`, `${a[best]} কে নিচে index ${best} এ নামাও।`) });
    i = best;
  }
}
export function heapInsert(arr, x, type = "max") {
  const a = [...arr, x]; const F = [{ a: [...a], hl: [a.length - 1], msg: msg(`Place ${x} at the next free slot, index ${a.length - 1} (keeps the tree complete).`, `${x} কে পরের খালি জায়গা index ${a.length - 1} এ রাখো (tree complete থাকে)।`) }];
  siftUp(a, a.length - 1, type, F); return { frames: F, result: a, swaps: F.filter((f) => f.swap).length };
}
export function heapExtract(arr, type = "max") {
  const a = [...arr]; const F = [{ a: [...a], hl: [0], msg: msg(`Remove the root ${a[0]} (the ${type}).`, `Root ${a[0]} সরাও (${type === "min" ? "সবচেয়ে ছোট" : "সবচেয়ে বড়"})।`) }];
  const top = a[0]; const last = a.pop();
  if (a.length) { a[0] = last; F.push({ a: [...a], hl: [0], msg: msg(`Move the last element ${last} to the root.`, `শেষ element ${last} কে root এ আনো।`) }); siftDown(a, 0, a.length, type, F); }
  return { frames: F, result: a, removed: top, swaps: F.filter((f) => f.swap).length };
}
export function buildHeap(arr, type = "max") {
  const a = [...arr]; const F = [{ a: [...a], hl: [], msg: msg(`Start: an unordered array. Heapify from the last non-leaf, index ⌊n/2⌋−1 = ${Math.floor(a.length / 2) - 1}, back to the root.`, `শুরু: এলোমেলো array। শেষ non-leaf, index ⌊n/2⌋−1 = ${Math.floor(a.length / 2) - 1} থেকে root পর্যন্ত heapify করো।`) }];
  for (let i = Math.floor(a.length / 2) - 1; i >= 0; i--) { F.push({ a: [...a], hl: [i], msg: msg(`heapify(${i}) — node ${a[i]}.`, `heapify(${i}) — node ${a[i]}।`) }); siftDown(a, i, a.length, type, F); }
  F.push({ a: [...a], hl: [], ok: a.map((_, k) => k), msg: msg(`Done: a valid ${type}-heap in O(n).`, `শেষ: একটা valid ${type}-heap, O(n) সময়ে।`) });
  return { frames: F, result: a, swaps: F.filter((f) => f.swap).length };
}
export function heapSort(arr) {
  const built = buildHeap(arr, "max"); const a = [...built.result]; const F = [...built.frames];
  for (let end = a.length - 1; end > 0; end--) {
    [a[0], a[end]] = [a[end], a[0]];
    F.push({ a: [...a], hl: [end], swap: [0, end], n: end, msg: msg(`Swap max ${a[end]} to the end (index ${end}); it is now in its final place.`, `সবচেয়ে বড় ${a[end]} কে শেষে (index ${end}) পাঠাও; এটা এখন স্থায়ী জায়গায়।`) });
    siftDown(a, 0, end, "max", F);
  }
  F.push({ a: [...a], hl: [], n: 0, ok: a.map((_, k) => k), msg: msg("Sorted ascending.", "ছোট থেকে বড় ক্রমে sorted।") });
  return { frames: F, result: a };
}
export function treeHeight(n) { return n <= 0 ? -1 : Math.floor(Math.log2(n)); }

// =====================================================================
// BST / AVL
// =====================================================================
const hgt = (t) => (t ? t.h : -1);
const upd = (t) => { t.h = 1 + Math.max(hgt(t.l), hgt(t.r)); return t; };
export const bf = (t) => (t ? hgt(t.l) - hgt(t.r) : 0);
const clone = (t) => (t ? { k: t.k, h: t.h, l: clone(t.l), r: clone(t.r) } : null);
const rotR = (y) => { const x = y.l; y.l = x.r; x.r = y; upd(y); return upd(x); };
const rotL = (x) => { const y = x.r; x.r = y.l; y.l = x; upd(x); return upd(y); };
export function avlInsert(root, key, { balance = true } = {}) {
  const F = []; const rots = []; let snap = () => clone(holder.root);
  const holder = { root };
  const path = [];
  function ins(t) {
    if (!t) { const n = { k: key, h: 0, l: null, r: null }; return n; }
    path.push(t.k);
    if (key === t.k) return t;
    if (key < t.k) t.l = ins(t.l); else t.r = ins(t.r);
    upd(t);
    return t;
  }
  // first pass: plain BST insert with path frames
  holder.root = ins(holder.root);
  path.forEach((k, idx) => F.push({ t: clone(root && idx === 0 ? root : holder.root), hl: [k], msg: msg(`At ${k}: ${key} ${key < k ? "<" : key > k ? ">" : "="} ${k} → go ${key < k ? "left" : "right"}.`, `${k} এ: ${key} ${key < k ? "<" : ">"} ${k} → ${key < k ? "বামে" : "ডানে"} যাও।`) }));
  F.push({ t: snap(), hl: [key], msg: msg(`Insert ${key} as a new leaf.`, `${key} কে নতুন leaf হিসেবে বসাও।`) });
  if (!balance) return { frames: F, result: holder.root, rots };
  // second pass: walk back up the path, fix imbalances (rebuild using recursion)
  function fix(t) {
    if (!t) return t;
    if (key < t.k) t.l = fix(t.l); else if (key > t.k) t.r = fix(t.r);
    upd(t); const b = bf(t);
    if (b > 1 || b < -1) {
      const kind = b > 1 ? (key < t.l.k ? "LL" : "LR") : (key > t.r.k ? "RR" : "RL");
      const pivot = t.k;
      F.push({ t: snap(), hl: [pivot], bad: [pivot], msg: msg(`Node ${pivot} has balance factor ${b} → ${kind} case.`, `Node ${pivot} এর balance factor ${b} → ${kind} case।`) });
      rots.push({ kind, at: pivot });
      if (kind === "LL") t = rotR(t);
      else if (kind === "RR") t = rotL(t);
      else if (kind === "LR") { t.l = rotL(t.l); t = rotR(t); }
      else { t.r = rotR(t.r); t = rotL(t); }
      pending.push({ kind, pivot, newTop: t.k });
    }
    return t;
  }
  const pending = [];
  holder.root = fix(holder.root);
  pending.forEach((p) => F.push({ t: snap(), hl: [p.newTop], msg: msg(`${p.kind === "LL" ? "Right rotation" : p.kind === "RR" ? "Left rotation" : p.kind === "LR" ? "Left-Right double rotation" : "Right-Left double rotation"} at ${p.pivot}: ${p.newTop} becomes the subtree root.`, `${p.pivot} এ ${p.kind === "LL" ? "Right rotation" : p.kind === "RR" ? "Left rotation" : p.kind === "LR" ? "Left-Right double rotation" : "Right-Left double rotation"}: ${p.newTop} এখন subtree root।`) }));
  if (!pending.length) F.push({ t: snap(), hl: [], msg: msg("Every balance factor is −1, 0 or +1 — no rotation needed.", "সব balance factor −1, 0 বা +1 — rotation লাগবে না।") });
  return { frames: F, result: holder.root, rots };
}
export function avlBuild(keys, opts) { let t = null; const rots = []; for (const k of keys) { const r = avlInsert(t, k, opts); t = r.result; rots.push(...r.rots); } return { tree: t, rots }; }
export const preorder = (t, out = []) => { if (t) { out.push(t.k); preorder(t.l, out); preorder(t.r, out); } return out; };
export const inorder = (t, out = []) => { if (t) { inorder(t.l, out); out.push(t.k); inorder(t.r, out); } return out; };
export const postorder = (t, out = []) => { if (t) { postorder(t.l, out); postorder(t.r, out); out.push(t.k); } return out; };
export const levelorder = (t) => { const out = [], q = t ? [t] : []; while (q.length) { const x = q.shift(); out.push(x.k); x.l && q.push(x.l); x.r && q.push(x.r); } return out; };
export const heightOf = (t) => hgt(t);

// =====================================================================
// B-tree of order m (max m−1 keys per node), split on overflow, median index ⌈m/2⌉−1
// =====================================================================
const bclone = (n) => ({ keys: [...n.keys], kids: n.kids.map(bclone) });
export function btreeInsert(root, key, m = 3) {
  root = root ? bclone(root) : { keys: [], kids: [] };
  const F = []; const mid = Math.ceil(m / 2) - 1;
  const path = []; let node = root;
  while (node.kids.length) { let i = 0; while (i < node.keys.length && key > node.keys[i]) i++; path.push([node, i]); F.push({ t: bclone(root), hl: [...node.keys], msg: msg(`At [${node.keys.join(", ")}] → child ${i}.`, `[${node.keys.join(", ")}] এ → child ${i}।`) }); node = node.kids[i]; }
  let i = 0; while (i < node.keys.length && key > node.keys[i]) i++;
  if (node.keys[i] === key) { F.push({ t: bclone(root), hl: [key], msg: msg(`${key} already exists.`, `${key} আগেই আছে।`) }); return { frames: F, result: root, splits: 0 }; }
  node.keys.splice(i, 0, key);
  F.push({ t: bclone(root), hl: [key], msg: msg(`Insert ${key} into leaf [${node.keys.join(", ")}].`, `${key} কে leaf [${node.keys.join(", ")}] এ বসাও।`) });
  let splits = 0;
  while (node.keys.length > m - 1) {
    const up = node.keys[mid];
    const right = { keys: node.keys.slice(mid + 1), kids: node.kids.slice(mid + 1) };
    node.keys = node.keys.slice(0, mid); node.kids = node.kids.slice(0, node.kids.length ? mid + 1 : 0);
    splits++;
    if (!path.length) { root = { keys: [up], kids: [node, right] }; F.push({ t: bclone(root), hl: [up], msg: msg(`Overflow (${m} keys) → split; median ${up} becomes a new root. Height grows by 1.`, `Overflow (${m}টা key) → split; median ${up} নতুন root। Height ১ বাড়ল।`) }); break; }
    const [par, ci] = path.pop();
    par.keys.splice(ci, 0, up); par.kids.splice(ci + 1, 0, right);
    F.push({ t: bclone(root), hl: [up], msg: msg(`Overflow → split; median ${up} moves up into the parent.`, `Overflow → split; median ${up} parent এ উঠে গেল।`) });
    node = par;
  }
  return { frames: F, result: root, splits };
}
export function btreeBuild(keys, m = 3) { let t = null, splits = 0; for (const k of keys) { const r = btreeInsert(t, k, m); t = r.result; splits += r.splits; } return { tree: t, splits }; }
export const btreeHeight = (t) => { let h = 0; while (t && t.kids.length) { h++; t = t.kids[0]; } return h; };
export const btreeNodes = (t) => (t ? 1 + t.kids.reduce((a, k) => a + btreeNodes(k), 0) : 0);

// =====================================================================
// Graphs
// =====================================================================
export const LETTERS = "ABCDEFGHIJ";
export function adj(G) {
  const A = Array.from({ length: G.n }, () => []);
  G.edges.forEach((e, idx) => { A[e.u].push({ v: e.v, w: e.w ?? 1, idx }); if (!G.directed) A[e.v].push({ v: e.u, w: e.w ?? 1, idx }); });
  A.forEach((l) => l.sort((x, y) => x.v - y.v));
  return A;
}
const L = (G, i) => (G.labels || LETTERS)[i];
export function bfs(G, s = 0) {
  const A = adj(G); const dist = Array(G.n).fill(Infinity); const seen = Array(G.n).fill(false); const order = [], tree = []; const F = [];
  const q = [s]; seen[s] = true; dist[s] = 0;
  F.push({ cur: s, vis: [s], q: [...q], order: [], tree: [], dist: [...dist], msg: msg(`Enqueue the source ${L(G, s)} (distance 0).`, `Source ${L(G, s)} কে queue তে রাখো (distance 0)।`) });
  while (q.length) {
    const u = q.shift(); order.push(u);
    F.push({ cur: u, vis: seen.flatMap((x, k) => (x ? [k] : [])), q: [...q], order: [...order], tree: [...tree], dist: [...dist], msg: msg(`Dequeue ${L(G, u)} and scan its neighbours in alphabetical order.`, `${L(G, u)} কে queue থেকে বের করো, তার neighbour গুলো বর্ণানুক্রমে দেখো।`) });
    for (const { v, idx } of A[u]) if (!seen[v]) {
      seen[v] = true; dist[v] = dist[u] + 1; q.push(v); tree.push(idx);
      F.push({ cur: u, edge: idx, vis: seen.flatMap((x, k) => (x ? [k] : [])), q: [...q], order: [...order], tree: [...tree], dist: [...dist], msg: msg(`Discover ${L(G, v)} (distance ${dist[v]}) → enqueue.`, `${L(G, v)} পাওয়া গেল (distance ${dist[v]}) → queue তে রাখো।`) });
    }
  }
  F.push({ vis: order, q: [], order, tree, dist, done: true, msg: msg(`BFS order: ${order.map((x) => L(G, x)).join(" → ")}`, `BFS ক্রম: ${order.map((x) => L(G, x)).join(" → ")}`) });
  return { frames: F, order, dist, tree };
}
export function dfs(G, s = 0) {
  const A = adj(G); const seen = Array(G.n).fill(false); const order = [], tree = [], fin = []; const d = Array(G.n).fill(0), f = Array(G.n).fill(0); let time = 0; const F = []; const stack = [];
  const visit = (u, viaEdge) => {
    seen[u] = true; d[u] = ++time; order.push(u); stack.push(u); if (viaEdge != null) tree.push(viaEdge);
    F.push({ cur: u, edge: viaEdge, vis: [...order], stack: [...stack], order: [...order], tree: [...tree], fin: [...fin], msg: msg(`Visit ${L(G, u)} (discovery time ${d[u]}). Go deep into its first unvisited neighbour.`, `${L(G, u)} visit করো (discovery time ${d[u]})। প্রথম unvisited neighbour এ গভীরে যাও।`) });
    for (const { v, idx } of A[u]) if (!seen[v]) visit(v, idx);
    f[u] = ++time; fin.push(u); stack.pop();
    F.push({ cur: stack[stack.length - 1], vis: [...order], stack: [...stack], order: [...order], tree: [...tree], fin: [...fin], msg: msg(`${L(G, u)} finished (time ${f[u]}) — backtrack.`, `${L(G, u)} শেষ (time ${f[u]}) — backtrack।`) });
  };
  visit(s, null);
  F.push({ vis: order, stack: [], order, tree, fin, done: true, msg: msg(`DFS order: ${order.map((x) => L(G, x)).join(" → ")}`, `DFS ক্রম: ${order.map((x) => L(G, x)).join(" → ")}`) });
  return { frames: F, order, tree, d, f };
}
export function dijkstra(G, s = 0) {
  const A = adj(G); const dist = Array(G.n).fill(Infinity), prev = Array(G.n).fill(-1), done = Array(G.n).fill(false); const F = []; const pe = Array(G.n).fill(-1);
  dist[s] = 0;
  F.push({ dist: [...dist], vis: [], cur: s, tree: [], msg: msg(`dist(${L(G, s)}) = 0, all others ∞.`, `dist(${L(G, s)}) = 0, বাকি সব ∞।`) });
  for (let it = 0; it < G.n; it++) {
    let u = -1; for (let v = 0; v < G.n; v++) if (!done[v] && dist[v] < Infinity && (u < 0 || dist[v] < dist[u])) u = v;
    if (u < 0) break; done[u] = true;
    const tree = pe.filter((x, k) => x >= 0 && done[k]);
    F.push({ dist: [...dist], vis: done.flatMap((x, k) => (x ? [k] : [])), cur: u, tree, msg: msg(`Pick the unvisited vertex with the smallest distance: ${L(G, u)} (${dist[u]}). It is final now.`, `সবচেয়ে কম distance এর unvisited vertex: ${L(G, u)} (${dist[u]})। এটা এখন final।`) });
    for (const { v, w, idx } of A[u]) {
      if (done[v]) continue;
      const nd = dist[u] + w; const better = nd < dist[v];
      F.push({ dist: [...dist], vis: done.flatMap((x, k) => (x ? [k] : [])), cur: u, edge: idx, tree, msg: msg(`Relax ${L(G, u)}→${L(G, v)}: ${dist[u]} + ${w} = ${nd} ${better ? `< ${dist[v] === Infinity ? "∞" : dist[v]} → update` : `≥ ${dist[v]} → keep`}.`, `Relax ${L(G, u)}→${L(G, v)}: ${dist[u]} + ${w} = ${nd} ${better ? `< ${dist[v] === Infinity ? "∞" : dist[v]} → update` : `≥ ${dist[v]} → আগেরটাই থাকবে`}।`) });
      if (better) { dist[v] = nd; prev[v] = u; pe[v] = idx; }
    }
  }
  const tree = pe.filter((x) => x >= 0);
  F.push({ dist: [...dist], vis: done.flatMap((x, k) => (x ? [k] : [])), tree, done: true, msg: msg(`Final distances: ${dist.map((d, k) => `${L(G, k)}=${d === Infinity ? "∞" : d}`).join(", ")}`, `চূড়ান্ত distance: ${dist.map((d, k) => `${L(G, k)}=${d === Infinity ? "∞" : d}`).join(", ")}`) });
  return { frames: F, dist, prev, tree };
}
export function bellmanFord(G, s = 0) {
  const dist = Array(G.n).fill(Infinity), pe = Array(G.n).fill(-1); dist[s] = 0; const F = [];
  const E = G.directed ? G.edges.map((e, idx) => ({ ...e, idx })) : G.edges.flatMap((e, idx) => [{ ...e, idx }, { u: e.v, v: e.u, w: e.w, idx }]);
  F.push({ dist: [...dist], vis: [s], tree: [], msg: msg(`dist(${L(G, s)}) = 0. Relax every edge, ${G.n - 1} times (|V|−1 passes).`, `dist(${L(G, s)}) = 0। সব edge কে ${G.n - 1} বার relax করো (|V|−1 pass)।`) });
  let passes = 0;
  for (let pass = 1; pass < G.n; pass++) {
    let changed = false; passes = pass;
    for (const e of E) {
      if (dist[e.u] === Infinity) continue;
      const nd = dist[e.u] + e.w;
      if (nd < dist[e.v]) { dist[e.v] = nd; pe[e.v] = e.idx; changed = true; F.push({ dist: [...dist], edge: e.idx, cur: e.u, tree: pe.filter((x) => x >= 0), pass, msg: msg(`Pass ${pass}: ${L(G, e.u)}→${L(G, e.v)} gives ${nd} → update.`, `Pass ${pass}: ${L(G, e.u)}→${L(G, e.v)} থেকে ${nd} → update।`) }); }
    }
    F.push({ dist: [...dist], tree: pe.filter((x) => x >= 0), pass, msg: msg(`End of pass ${pass}${changed ? "" : " — nothing changed, we can stop early"}.`, `Pass ${pass} শেষ${changed ? "" : " — কিছু বদলায়নি, আগেই থামা যায়"}।`) });
    if (!changed) break;
  }
  const neg = E.some((e) => dist[e.u] !== Infinity && dist[e.u] + e.w < dist[e.v]);
  F.push({ dist: [...dist], tree: pe.filter((x) => x >= 0), done: true, msg: neg ? msg("One more pass still improves a distance → negative-weight cycle!", "আরও এক pass এ distance কমছে → negative-weight cycle আছে!") : msg(`Extra check pass: no change → no negative cycle. Final: ${dist.map((d, k) => `${L(G, k)}=${d === Infinity ? "∞" : d}`).join(", ")}`, `অতিরিক্ত যাচাই: কিছু বদলায়নি → negative cycle নেই। চূড়ান্ত: ${dist.map((d, k) => `${L(G, k)}=${d === Infinity ? "∞" : d}`).join(", ")}`) });
  return { frames: F, dist, neg, passes };
}
export function prim(G, s = 0) {
  const A = adj(G); const inT = Array(G.n).fill(false); const tree = []; let total = 0; const F = [];
  inT[s] = true; F.push({ vis: [s], tree: [], msg: msg(`Start the tree at ${L(G, s)}.`, `${L(G, s)} থেকে tree শুরু।`) });
  for (let it = 1; it < G.n; it++) {
    let best = null;
    for (let u = 0; u < G.n; u++) if (inT[u]) for (const e of A[u]) if (!inT[e.v] && (!best || e.w < best.w || (e.w === best.w && e.v < best.v))) best = { u, ...e };
    if (!best) break;
    inT[best.v] = true; tree.push(best.idx); total += best.w;
    F.push({ vis: inT.flatMap((x, k) => (x ? [k] : [])), tree: [...tree], edge: best.idx, msg: msg(`Cheapest edge leaving the tree: ${L(G, best.u)}–${L(G, best.v)} (${best.w}). Total = ${total}.`, `Tree থেকে বের হওয়া সবচেয়ে সস্তা edge: ${L(G, best.u)}–${L(G, best.v)} (${best.w})। মোট = ${total}।`) });
  }
  F.push({ vis: inT.flatMap((x, k) => (x ? [k] : [])), tree, done: true, msg: msg(`MST weight = ${total}.`, `MST এর ওজন = ${total}।`) });
  return { frames: F, tree, total };
}
export function kruskal(G) {
  const par = Array.from({ length: G.n }, (_, i) => i); const find = (x) => (par[x] === x ? x : (par[x] = find(par[x])));
  const order = G.edges.map((e, idx) => ({ ...e, idx })).sort((a, b) => a.w - b.w || a.idx - b.idx); const tree = []; let total = 0; const F = [];
  F.push({ tree: [], vis: [], msg: msg(`Sort edges by weight: ${order.map((e) => `${L(G, e.u)}${L(G, e.v)}(${e.w})`).join(", ")}.`, `Edge গুলো weight অনুযায়ী সাজাও: ${order.map((e) => `${L(G, e.u)}${L(G, e.v)}(${e.w})`).join(", ")}।`) });
  for (const e of order) {
    const a = find(e.u), b = find(e.v);
    if (a !== b) { par[a] = b; tree.push(e.idx); total += e.w; F.push({ tree: [...tree], edge: e.idx, vis: [...new Set(tree.flatMap((i) => [G.edges[i].u, G.edges[i].v]))], msg: msg(`Take ${L(G, e.u)}–${L(G, e.v)} (${e.w}): joins two components. Total = ${total}.`, `${L(G, e.u)}–${L(G, e.v)} (${e.w}) নাও: দুটো component জোড়া লাগে। মোট = ${total}।`) }); }
    else F.push({ tree: [...tree], edge: e.idx, reject: e.idx, vis: [...new Set(tree.flatMap((i) => [G.edges[i].u, G.edges[i].v]))], msg: msg(`Skip ${L(G, e.u)}–${L(G, e.v)} (${e.w}): it would make a cycle.`, `${L(G, e.u)}–${L(G, e.v)} (${e.w}) বাদ: cycle তৈরি করবে।`) });
    if (tree.length === G.n - 1) break;
  }
  F.push({ tree, vis: Array.from({ length: G.n }, (_, i) => i), done: true, msg: msg(`MST weight = ${total}.`, `MST এর ওজন = ${total}।`) });
  return { frames: F, tree, total };
}
export function topo(G) { // Kahn's algorithm with frames, smallest label first
  const indeg = Array(G.n).fill(0); G.edges.forEach((e) => indeg[e.v]++); const out = []; const F = []; const used = [];
  let ready = indeg.flatMap((d, k) => (d ? [] : [k]));
  F.push({ indeg: [...indeg], ready: [...ready], order: [], vis: [], tree: [], msg: msg(`Count in-degrees: ${indeg.map((d, k) => `${L(G, k)}=${d}`).join(", ")}. Vertices with in-degree 0 are ready.`, `In-degree গোনো: ${indeg.map((d, k) => `${L(G, k)}=${d}`).join(", ")}। যাদের in-degree 0, তারা ready।`) });
  while (ready.length) {
    ready.sort((a, b) => a - b); const u = ready.shift(); out.push(u);
    F.push({ indeg: [...indeg], ready: [...ready], order: [...out], vis: [...out], cur: u, tree: [...used], msg: msg(`Output ${L(G, u)} (smallest ready vertex).`, `${L(G, u)} output করো (ready এর মধ্যে সবচেয়ে ছোট)।`) });
    G.edges.forEach((e, idx) => {
      if (e.u !== u) return;
      indeg[e.v]--; used.push(idx); const nowReady = indeg[e.v] === 0; if (nowReady) ready.push(e.v);
      F.push({ indeg: [...indeg], ready: [...ready], order: [...out], vis: [...out], cur: u, edge: idx, tree: [...used], msg: msg(`Remove edge ${L(G, u)}→${L(G, e.v)}: in-degree of ${L(G, e.v)} becomes ${indeg[e.v]}${nowReady ? " → ready" : ""}.`, `${L(G, u)}→${L(G, e.v)} edge সরাও: ${L(G, e.v)} এর in-degree এখন ${indeg[e.v]}${nowReady ? " → ready" : ""}।`) });
    });
  }
  const ok = out.length === G.n;
  F.push({ indeg: [...indeg], ready: [], order: out, vis: out, tree: used, done: true, msg: ok ? msg(`Topological order: ${out.map((x) => L(G, x)).join(" → ")}`, `Topological ক্রম: ${out.map((x) => L(G, x)).join(" → ")}`) : msg("Some vertices never became ready → the graph has a cycle.", "কিছু vertex কখনো ready হয়নি → graph এ cycle আছে।") });
  return { frames: F, order: ok ? out : null };
}
export function topoSort(G) { // Kahn, smallest label first
  const indeg = Array(G.n).fill(0); G.edges.forEach((e) => indeg[e.v]++); const A = adj(G); const out = []; const ready = indeg.flatMap((d, k) => (d ? [] : [k]));
  while (ready.length) { ready.sort((a, b) => a - b); const u = ready.shift(); out.push(u); for (const { v } of A[u]) if (--indeg[v] === 0) ready.push(v); }
  return out.length === G.n ? out : null;
}

// =====================================================================
// Sorting
// =====================================================================
export function mergeSort(arr) {
  const a = [...arr]; const F = []; let comps = 0;
  F.push({ a: [...a], msg: msg("Divide the array in halves until each piece has one element.", "Array কে অর্ধেক করতে থাকো যতক্ষণ না প্রতিটা অংশে একটা element থাকে।") });
  const rec = (l, r, depth) => {
    if (r - l < 1) return;
    const m = Math.floor((l + r) / 2);
    F.push({ a: [...a], range: [l, r], mid: m, depth, msg: msg(`Split [${l}..${r}] into [${l}..${m}] and [${m + 1}..${r}].`, `[${l}..${r}] কে [${l}..${m}] আর [${m + 1}..${r}] এ ভাগ।`) });
    rec(l, m, depth + 1); rec(m + 1, r, depth + 1);
    const L1 = a.slice(l, m + 1), R1 = a.slice(m + 1, r + 1); let i = 0, j = 0, k = l;
    while (i < L1.length && j < R1.length) { comps++; a[k++] = L1[i] <= R1[j] ? L1[i++] : R1[j++]; }
    while (i < L1.length) a[k++] = L1[i++]; while (j < R1.length) a[k++] = R1[j++];
    F.push({ a: [...a], range: [l, r], merged: true, depth, msg: msg(`Merge → [${a.slice(l, r + 1).join(", ")}].`, `Merge → [${a.slice(l, r + 1).join(", ")}]।`) });
  };
  rec(0, a.length - 1, 0);
  F.push({ a: [...a], done: true, msg: msg(`Sorted with ${comps} comparisons. T(n) = 2T(n/2) + Θ(n) = Θ(n log n).`, `${comps} টা তুলনায় sorted। T(n) = 2T(n/2) + Θ(n) = Θ(n log n)।`) });
  return { frames: F, result: a, comps };
}
export function quickSort(arr) { // Lomuto, pivot = last
  const a = [...arr]; const F = []; let comps = 0, swaps = 0; const pivots = [];
  const rec = (l, r) => {
    if (l >= r) return;
    const p = a[r]; let i = l - 1;
    F.push({ a: [...a], range: [l, r], piv: r, msg: msg(`Partition [${l}..${r}] around pivot ${p} (last element).`, `[${l}..${r}] কে pivot ${p} (শেষ element) ঘিরে partition।`) });
    for (let j = l; j < r; j++) {
      comps++;
      if (a[j] <= p) { i++; [a[i], a[j]] = [a[j], a[i]]; swaps++; F.push({ a: [...a], range: [l, r], piv: r, i, j, msg: msg(`${a[i]} ≤ ${p} → move it to the left part (i = ${i}).`, `${a[i]} ≤ ${p} → বাম অংশে নাও (i = ${i})।`) }); }
    }
    [a[i + 1], a[r]] = [a[r], a[i + 1]]; swaps++; pivots.push(i + 1);
    F.push({ a: [...a], range: [l, r], fixed: [...pivots], piv: i + 1, msg: msg(`Pivot ${p} lands at index ${i + 1} — its final position.`, `Pivot ${p} index ${i + 1} এ বসল — এটাই চূড়ান্ত জায়গা।`) });
    rec(l, i); rec(i + 2, r);
  };
  rec(0, a.length - 1);
  F.push({ a: [...a], fixed: a.map((_, k) => k), done: true, msg: msg(`Sorted: ${comps} comparisons. Average Θ(n log n); worst Θ(n²) (already-sorted input with last-element pivot).`, `Sorted: ${comps} টা তুলনা। গড়ে Θ(n log n); worst Θ(n²) (sorted input এ শেষ element pivot হলে)।`) });
  return { frames: F, result: a, comps, swaps, firstPartition: null };
}
export function partitionOnce(arr) { const a = [...arr]; const p = a[a.length - 1]; let i = -1; for (let j = 0; j < a.length - 1; j++) if (a[j] <= p) { i++; [a[i], a[j]] = [a[j], a[i]]; } [a[i + 1], a[a.length - 1]] = [a[a.length - 1], a[i + 1]]; return { a, pivotIndex: i + 1 }; }
export function insertionSort(arr) {
  const a = [...arr]; const F = []; let comps = 0, shifts = 0;
  for (let i = 1; i < a.length; i++) {
    const key = a[i]; let j = i - 1;
    F.push({ a: [...a], key: i, sortedTo: i - 1, msg: msg(`Take key ${key}; slide it left into the sorted prefix.`, `Key ${key} নাও; sorted অংশে বামে সরিয়ে বসাও।`) });
    while (j >= 0) { comps++; if (a[j] > key) { a[j + 1] = a[j]; shifts++; j--; } else break; }
    a[j + 1] = key;
    F.push({ a: [...a], key: j + 1, sortedTo: i, msg: msg(`${key} inserted at index ${j + 1}.`, `${key} index ${j + 1} এ বসল।`) });
  }
  F.push({ a: [...a], done: true, msg: msg(`Sorted: ${comps} comparisons, ${shifts} shifts. Best Θ(n), worst Θ(n²).`, `Sorted: ${comps} তুলনা, ${shifts} shift। Best Θ(n), worst Θ(n²)।`) });
  return { frames: F, result: a, comps, shifts };
}
export function binarySearch(arr, x) {
  const F = []; let lo = 0, hi = arr.length - 1, probes = 0;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2); probes++;
    F.push({ a: [...arr], range: [lo, hi], mid, msg: msg(`lo=${lo}, hi=${hi}, mid=${mid}: a[mid]=${arr[mid]} ${arr[mid] === x ? "= target ✓" : arr[mid] < x ? "< target → go right" : "> target → go left"}.`, `lo=${lo}, hi=${hi}, mid=${mid}: a[mid]=${arr[mid]} ${arr[mid] === x ? "= target ✓" : arr[mid] < x ? "< target → ডানে যাও" : "> target → বামে যাও"}।`) });
    if (arr[mid] === x) return { frames: F, index: mid, probes };
    if (arr[mid] < x) lo = mid + 1; else hi = mid - 1;
  }
  F.push({ a: [...arr], range: [lo, hi], msg: msg("lo > hi → not found.", "lo > hi → পাওয়া যায়নি।") });
  return { frames: F, index: -1, probes };
}
export function countingSort(arr) { const max = Math.max(...arr); const c = Array(max + 1).fill(0); arr.forEach((x) => c[x]++); const out = []; c.forEach((n, v) => { for (let i = 0; i < n; i++) out.push(v); }); return { result: out, counts: c }; }

// =====================================================================
// Greedy
// =====================================================================
export function activitySelect(acts) {
  const order = acts.map((a, i) => ({ ...a, i })).sort((x, y) => x.f - y.f || x.s - y.s); const pick = []; let last = -Infinity; const F = [];
  F.push({ order, pick: [], msg: msg("Sort activities by finish time.", "Activity গুলোকে finish time অনুযায়ী সাজাও।") });
  for (const a of order) {
    if (a.s >= last) { pick.push(a.i); last = a.f; F.push({ order, pick: [...pick], cur: a.i, ok: true, msg: msg(`${a.name}: starts ${a.s} ≥ last finish → take it. Last finish = ${a.f}.`, `${a.name}: শুরু ${a.s} ≥ শেষ finish → নাও। শেষ finish = ${a.f}।`) }); }
    else F.push({ order, pick: [...pick], cur: a.i, ok: false, msg: msg(`${a.name}: starts ${a.s} < ${last} → overlaps, skip.`, `${a.name}: শুরু ${a.s} < ${last} → overlap, বাদ।`) });
  }
  F.push({ order, pick, done: true, msg: msg(`${pick.length} activities selected.`, `${pick.length} টা activity নির্বাচিত।`) });
  return { frames: F, pick, count: pick.length };
}
export function fracKnapsack(items, W) {
  const order = items.map((it, i) => ({ ...it, i, r: it.v / it.w })).sort((a, b) => b.r - a.r); let cap = W, value = 0; const take = Array(items.length).fill(0); const F = [];
  F.push({ order, take: [...take], cap, value, msg: msg("Sort items by value/weight ratio (highest first).", "Item গুলো value/weight ratio অনুযায়ী সাজাও (বড় আগে)।") });
  for (const it of order) {
    if (cap <= 0) break;
    const amt = Math.min(1, cap / it.w); take[it.i] = amt; cap -= amt * it.w; value += amt * it.v;
    F.push({ order, take: [...take], cap, value, cur: it.i, msg: msg(`${it.name} (ratio ${+it.r.toFixed(2)}): take ${amt === 1 ? "all" : `${+(amt * 100).toFixed(1)}%`} → value ${+value.toFixed(2)}, capacity left ${+cap.toFixed(2)}.`, `${it.name} (ratio ${+it.r.toFixed(2)}): ${amt === 1 ? "পুরোটা" : `${+(amt * 100).toFixed(1)}%`} নাও → value ${+value.toFixed(2)}, বাকি capacity ${+cap.toFixed(2)}।`) });
  }
  F.push({ order, take, cap, value, done: true, msg: msg(`Maximum value = ${+value.toFixed(2)}.`, `সর্বোচ্চ value = ${+value.toFixed(2)}।`) });
  return { frames: F, value, take };
}
export function huffman(freq) { // freq: [[ch, f], ...]; ties: lower freq, then earlier created
  let id = 0; let pq = freq.map(([ch, f]) => ({ ch, f, id: id++ })); const F = [];
  const sortQ = () => pq.sort((a, b) => a.f - b.f || a.id - b.id);
  sortQ(); F.push({ forest: pq.map(hclone), msg: msg("Put every symbol in a min-priority queue keyed by frequency.", "প্রতিটা symbol কে frequency অনুযায়ী min-priority queue তে রাখো।") });
  while (pq.length > 1) {
    const a = pq.shift(), b = pq.shift(); const n = { f: a.f + b.f, l: a, r: b, id: id++ };
    pq.push(n); sortQ();
    F.push({ forest: pq.map(hclone), hl: n.id, msg: msg(`Take the two smallest (${label(a)}:${a.f}, ${label(b)}:${b.f}) → merge into ${n.f}.`, `সবচেয়ে ছোট দুটো (${label(a)}:${a.f}, ${label(b)}:${b.f}) নাও → ${n.f} এ জোড়া লাগাও।`) });
  }
  const codes = {}; const walk = (t, c) => { if (!t) return; if (t.ch !== undefined) { codes[t.ch] = c || "0"; return; } walk(t.l, c + "0"); walk(t.r, c + "1"); }; walk(pq[0], "");
  const bits = freq.reduce((s, [ch, f]) => s + f * codes[ch].length, 0);
  F.push({ forest: pq.map(hclone), codes, bits, done: true, msg: msg(`Codes: left = 0, right = 1. Total bits = Σ f·depth = ${bits}.`, `Code: বাম = 0, ডান = 1। মোট bit = Σ f·depth = ${bits}।`) });
  return { frames: F, codes, bits, tree: pq[0] };
}
const label = (t) => (t.ch !== undefined ? t.ch : "•");
const hclone = (t) => (t ? { ch: t.ch, f: t.f, id: t.id, l: hclone(t.l), r: hclone(t.r) } : null);

// =====================================================================
// Dynamic programming
// =====================================================================
export function fibTab(n) { const T = [0, 1]; for (let i = 2; i <= n; i++) T[i] = T[i - 1] + T[i - 2]; return T.slice(0, n + 1); }
export function fibCalls(n) { return n < 2 ? 1 : 1 + fibCalls(n - 1) + fibCalls(n - 2); }
export function knapsack01(items, W) {
  const n = items.length; const T = Array.from({ length: n + 1 }, () => Array(W + 1).fill(0)); const F = [];
  for (let i = 1; i <= n; i++) for (let w = 0; w <= W; w++) {
    const it = items[i - 1]; const skip = T[i - 1][w]; const take = it.w <= w ? T[i - 1][w - it.w] + it.v : -1;
    T[i][w] = Math.max(skip, take);
    F.push({ T: T.map((r) => [...r]), cell: [i, w], from: take > skip ? [[i - 1, w - it.w]] : [[i - 1, w]], msg: msg(`T[${i}][${w}]: ${it.w > w ? `${it.name} (w=${it.w}) doesn't fit → copy ${skip}` : `max(skip = ${skip}, take = ${T[i - 1][w - it.w]} + ${it.v} = ${take}) = ${T[i][w]}`}.`, `T[${i}][${w}]: ${it.w > w ? `${it.name} (w=${it.w}) আঁটে না → উপরেরটা ${skip}` : `max(না নিলে ${skip}, নিলে ${T[i - 1][w - it.w]} + ${it.v} = ${take}) = ${T[i][w]}`}।`) });
  }
  const chosen = []; let w = W; for (let i = n; i > 0; i--) if (T[i][w] !== T[i - 1][w]) { chosen.unshift(i - 1); w -= items[i - 1].w; }
  F.push({ T, done: true, chosen, msg: msg(`Best value = ${T[n][W]}; items: ${chosen.map((i) => items[i].name).join(", ") || "none"}.`, `সর্বোচ্চ value = ${T[n][W]}; item: ${chosen.map((i) => items[i].name).join(", ") || "কিছু না"}।`) });
  return { frames: F, best: T[n][W], chosen, T };
}
export function lcs(X, Y) {
  const m = X.length, n = Y.length; const T = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0)); const F = [];
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    if (X[i - 1] === Y[j - 1]) { T[i][j] = T[i - 1][j - 1] + 1; F.push({ T: T.map((r) => [...r]), cell: [i, j], from: [[i - 1, j - 1]], msg: msg(`${X[i - 1]} = ${Y[j - 1]} → diagonal + 1 = ${T[i][j]}.`, `${X[i - 1]} = ${Y[j - 1]} → কোণাকুণি + 1 = ${T[i][j]}।`) }); }
    else { T[i][j] = Math.max(T[i - 1][j], T[i][j - 1]); F.push({ T: T.map((r) => [...r]), cell: [i, j], from: [T[i - 1][j] >= T[i][j - 1] ? [i - 1, j] : [i, j - 1]], msg: msg(`${X[i - 1]} ≠ ${Y[j - 1]} → max(up ${T[i - 1][j]}, left ${T[i][j - 1]}) = ${T[i][j]}.`, `${X[i - 1]} ≠ ${Y[j - 1]} → max(উপর ${T[i - 1][j]}, বাম ${T[i][j - 1]}) = ${T[i][j]}।`) }); }
  }
  let i = m, j = n, s = ""; const path = [];
  while (i > 0 && j > 0) { path.push([i, j]); if (X[i - 1] === Y[j - 1]) { s = X[i - 1] + s; i--; j--; } else if (T[i - 1][j] >= T[i][j - 1]) i--; else j--; }
  F.push({ T, done: true, path, msg: msg(`LCS length = ${T[m][n]}; one LCS = "${s}".`, `LCS এর দৈর্ঘ্য = ${T[m][n]}; একটা LCS = "${s}"।`) });
  return { frames: F, len: T[m][n], str: s, T };
}
export function matrixChain(dims) { // dims p0..pn
  const n = dims.length - 1; const M = Array.from({ length: n + 1 }, () => Array(n + 1).fill(null)); const S = Array.from({ length: n + 1 }, () => Array(n + 1).fill(0)); const F = [];
  for (let i = 1; i <= n; i++) M[i][i] = 0;
  for (let len = 2; len <= n; len++) for (let i = 1; i + len - 1 <= n; i++) {
    const j = i + len - 1; let best = Infinity, bk = i; const tries = [];
    for (let k = i; k < j; k++) { const c = M[i][k] + M[k + 1][j] + dims[i - 1] * dims[k] * dims[j]; tries.push(`k=${k}: ${c}`); if (c < best) { best = c; bk = k; } }
    M[i][j] = best; S[i][j] = bk;
    F.push({ T: M.map((r) => [...r]), cell: [i, j], from: [[i, bk], [bk + 1, j]], msg: msg(`m[${i}][${j}] = min(${tries.join(", ")}) = ${best}, split k = ${bk}.`, `m[${i}][${j}] = min(${tries.join(", ")}) = ${best}, split k = ${bk}।`) });
  }
  const paren = (i, j) => (i === j ? `A${i}` : `(${paren(i, S[i][j])}${paren(S[i][j] + 1, j)})`);
  F.push({ T: M, done: true, msg: msg(`Minimum scalar multiplications = ${M[1][n]}; order ${paren(1, n)}.`, `সর্বনিম্ন scalar গুণ = ${M[1][n]}; ক্রম ${paren(1, n)}।`) });
  return { frames: F, best: M[1][n], order: paren(1, n), M, S };
}

// =====================================================================
// Recursion helpers
// =====================================================================
export const sumDigits = (n) => (n === 0 ? 0 : (n % 10) + sumDigits(Math.floor(n / 10)));
export const digitCalls = (n) => (n === 0 ? 1 : 1 + digitCalls(Math.floor(n / 10)));
export function shuffle(a) { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
export const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export function distinct(n, lo = 1, hi = 99) { const s = new Set(); while (s.size < n) s.add(ri(lo, hi)); return [...s]; }

// =====================================================================
// Linear structures, hashing and tries (step-traced)
// =====================================================================
/** ops: ["push 5", "pop", "peek"] */
export function stackOps(ops) {
  const st = []; const F = [{ st: [], msg: msg("Empty stack. Top is where everything happens.", "খালি stack। সব কাজ top এ হয়।") }]; const out = [];
  for (const op of ops) {
    const [cmd, v] = op.trim().split(/\s+/);
    if (cmd === "push") { st.push(+v); F.push({ st: [...st], hl: [st.length - 1], msg: msg(`push ${v}: put it on top.`, `push ${v}: top এ রাখো।`) }); }
    else if (cmd === "pop") {
      if (!st.length) { F.push({ st: [], bad: true, msg: msg("pop on an empty stack → underflow!", "খালি stack এ pop → underflow!") }); continue; }
      const x = st.pop(); out.push(x); F.push({ st: [...st], out: [...out], gone: x, msg: msg(`pop → ${x} leaves from the top (LIFO).`, `pop → ${x} top থেকে বের হলো (LIFO)।`) });
    } else if (cmd === "peek") F.push({ st: [...st], hl: st.length ? [st.length - 1] : [], msg: msg(st.length ? `peek → ${st[st.length - 1]} (look only, do not remove).` : "peek on an empty stack.", st.length ? `peek → ${st[st.length - 1]} (শুধু দেখো, সরাও না)।` : "খালি stack এ peek।") });
  }
  F.push({ st: [...st], out, done: true, msg: msg(`Popped in order: ${out.join(", ") || "none"}. Every operation is O(1).`, `Pop এর ক্রম: ${out.join(", ") || "কিছু না"}। প্রতিটা operation O(1)।`) });
  return { frames: F, stack: st, popped: out };
}
/** Circular queue of capacity cap. ops: ["enqueue 5", "dequeue"] */
export function queueOps(ops, cap = 6) {
  const q = Array(cap).fill(null); let front = 0, size = 0; const out = [];
  const rear = () => (front + size - 1 + cap) % cap;
  const F = [{ q: [...q], front, rear: -1, size, msg: msg(`Empty circular queue of capacity ${cap}. front = 0.`, `${cap} ঘরের খালি circular queue। front = 0।`) }];
  for (const op of ops) {
    const [cmd, v] = op.trim().split(/\s+/);
    if (cmd === "enqueue") {
      if (size === cap) { F.push({ q: [...q], front, rear: rear(), size, bad: true, msg: msg("Queue is full → overflow!", "Queue ভরা → overflow!") }); continue; }
      const r = (front + size) % cap; q[r] = +v; size++;
      F.push({ q: [...q], front, rear: r, size, hl: [r], msg: msg(`enqueue ${v} at rear = (front + size) mod ${cap} = ${r}.`, `enqueue ${v}: rear = (front + size) mod ${cap} = ${r}।`) });
    } else if (cmd === "dequeue") {
      if (!size) { F.push({ q: [...q], front, rear: -1, size, bad: true, msg: msg("dequeue on an empty queue → underflow!", "খালি queue তে dequeue → underflow!") }); continue; }
      const x = q[front]; q[front] = null; out.push(x); front = (front + 1) % cap; size--;
      F.push({ q: [...q], front, rear: size ? rear() : -1, size, out: [...out], msg: msg(`dequeue → ${x} leaves from the front (FIFO). front moves to ${front}.`, `dequeue → ${x} সামনে থেকে বের হলো (FIFO)। front এখন ${front}।`) });
    }
  }
  F.push({ q: [...q], front, rear: size ? rear() : -1, size, out, done: true, msg: msg(`Dequeued in order: ${out.join(", ") || "none"}. All O(1) — the array wraps around.`, `Dequeue এর ক্রম: ${out.join(", ") || "কিছু না"}। সব O(1) — array ঘুরে আবার শুরুতে আসে।`) });
  return { frames: F, queue: q, front, size, dequeued: out };
}
/** Singly linked list: op = head | tail | insert | delete | reverse */
export function listOp(vals, op, x, pos = 0) {
  const a = [...vals]; const F = [];
  if (op === "head") {
    F.push({ list: [...a], newNode: x, msg: msg(`Create node ${x}.`, `${x} এর node বানাও।`) });
    a.unshift(x); F.push({ list: [...a], hl: [0], msg: msg("newNode.next = head; head = newNode. O(1).", "newNode.next = head; head = newNode। O(1)।") });
  } else if (op === "tail") {
    for (let i = 0; i < a.length; i++) F.push({ list: [...a], cur: i, msg: msg(`Walk: cur = ${a[i]}${i === a.length - 1 ? " (last node)" : ""}.`, `হাঁটো: cur = ${a[i]}${i === a.length - 1 ? " (শেষ node)" : ""}।`) });
    a.push(x); F.push({ list: [...a], hl: [a.length - 1], msg: msg(`last.next = newNode(${x}). O(n) without a tail pointer.`, `last.next = newNode(${x})। tail pointer না থাকলে O(n)।`) });
  } else if (op === "insert") {
    const p = Math.max(0, Math.min(pos, a.length));
    for (let i = 0; i < p; i++) F.push({ list: [...a], cur: i, msg: msg(`Walk to position ${p}: cur = ${a[i]}.`, `অবস্থান ${p} পর্যন্ত হাঁটো: cur = ${a[i]}।`) });
    a.splice(p, 0, x); F.push({ list: [...a], hl: [p], msg: msg(`newNode.next = prev.next; prev.next = newNode → ${x} at position ${p}.`, `newNode.next = prev.next; prev.next = newNode → ${x} অবস্থান ${p} এ।`) });
  } else if (op === "delete") {
    let i = 0;
    for (; i < a.length; i++) { F.push({ list: [...a], cur: i, msg: msg(`Compare ${a[i]} with ${x}.`, `${a[i]} কে ${x} এর সাথে মেলাও।`) }); if (a[i] === x) break; }
    if (i === a.length) F.push({ list: [...a], msg: msg(`${x} not found.`, `${x} পাওয়া যায়নি।`) });
    else { F.push({ list: [...a], gone: i, msg: msg(`Found. prev.next = cur.next — node ${x} is skipped.`, `পাওয়া গেছে। prev.next = cur.next — ${x} node বাদ পড়ল।`) }); a.splice(i, 1); }
  } else if (op === "reverse") {
    const r = []; const rest = [...a];
    F.push({ list: [...a], rev: 0, msg: msg("prev = null, cur = head.", "prev = null, cur = head।") });
    while (rest.length) { const c = rest.shift(); r.unshift(c); F.push({ list: [...r, ...rest], rev: r.length, hl: [0], msg: msg(`next = cur.next; cur.next = prev (${c} now points back); prev = cur; cur = next.`, `next = cur.next; cur.next = prev (${c} এখন পিছনে নির্দেশ করে); prev = cur; cur = next।`) }); }
    a.splice(0, a.length, ...r);
  }
  F.push({ list: [...a], done: true, msg: msg(`List: ${a.join(" → ") || "empty"} → null${op === "reverse" ? ". Reversed in O(n) time, O(1) space." : ""}`, `List: ${a.join(" → ") || "খালি"} → null${op === "reverse" ? "। O(n) সময়ে, O(1) জায়গায় উল্টানো হলো।" : ""}`) });
  return { frames: F, list: a };
}
/** Hash table insert: mode "chain" or "probe" (linear probing), h(k) = k mod m. */
export function hashInsert(keys, m = 7, mode = "chain") {
  const T = Array.from({ length: m }, () => (mode === "chain" ? [] : null)); const F = []; let collisions = 0;
  const snap = () => (mode === "chain" ? T.map((c) => [...c]) : [...T]);
  F.push({ T: snap(), msg: msg(`Empty table of size m = ${m}; h(k) = k mod ${m}.`, `m = ${m} ঘরের খালি table; h(k) = k mod ${m}।`) });
  for (const k of keys) {
    const h0 = ((k % m) + m) % m;
    if (mode === "chain") {
      if (T[h0].length) collisions++; T[h0].push(k);
      F.push({ T: snap(), hl: [h0], key: k, msg: msg(`h(${k}) = ${k} mod ${m} = ${h0}${T[h0].length > 1 ? " — collision, add to the chain" : ""}.`, `h(${k}) = ${k} mod ${m} = ${h0}${T[h0].length > 1 ? " — collision, chain এ যোগ করো" : ""}।`) });
    } else {
      let i = 0, s = h0;
      while (T[s] !== null && i < m) { collisions++; F.push({ T: snap(), hl: [s], bad: [s], key: k, msg: msg(`Slot ${s} is taken by ${T[s]} → try ${(s + 1) % m}.`, `ঘর ${s} এ ${T[s]} আছে → ${(s + 1) % m} এ চেষ্টা করো।`) }); i++; s = (h0 + i) % m; }
      if (i === m) { F.push({ T: snap(), key: k, msg: msg("Table full!", "Table ভরা!") }); continue; }
      T[s] = k; F.push({ T: snap(), hl: [s], key: k, msg: msg(`h(${k}) = ${h0}${s !== h0 ? `, probed to ${s}` : ""} → store ${k} in slot ${s}.`, `h(${k}) = ${h0}${s !== h0 ? `, probe করে ${s}` : ""} → ${k} কে ঘর ${s} এ রাখো।`) });
    }
  }
  F.push({ T: snap(), done: true, msg: msg(`Load factor α = n/m = ${keys.length}/${m} = ${(keys.length / m).toFixed(2)}; ${collisions} collision${collisions === 1 ? "" : "s"}.`, `Load factor α = n/m = ${keys.length}/${m} = ${(keys.length / m).toFixed(2)}; ${collisions} টা collision।`) });
  return { frames: F, table: T, collisions };
}
/** Trie insert (+ optional search) with frames. */
export function trieBuild(words, search = null) {
  const root = { ch: "•", kids: {}, end: false, id: 0 }; let id = 1; const F = [];
  const clone = (n) => ({ ch: n.ch, end: n.end, id: n.id, kids: Object.fromEntries(Object.entries(n.kids).map(([k, v]) => [k, clone(v)])) });
  F.push({ t: clone(root), path: [0], msg: msg("Empty trie: just the root.", "খালি trie: শুধু root।") });
  for (const w of words) {
    let n = root; const path = [0];
    for (const c of w) {
      const isNew = !n.kids[c]; if (isNew) n.kids[c] = { ch: c, kids: {}, end: false, id: id++ };
      n = n.kids[c]; path.push(n.id);
      F.push({ t: clone(root), path: [...path], msg: msg(`"${w}": ${isNew ? `create node '${c}'` : `'${c}' already exists — share it`}.`, `"${w}": ${isNew ? `'${c}' node বানাও` : `'${c}' আগেই আছে — ভাগ করে নাও`}।`) });
    }
    n.end = true; F.push({ t: clone(root), path, endAt: n.id, msg: msg(`Mark '${w[w.length - 1]}' as the end of "${w}".`, `'${w[w.length - 1]}' কে "${w}" এর শেষ হিসেবে চিহ্নিত করো।`) });
  }
  let found = null;
  if (search) {
    let n = root; const path = [0]; let ok = true;
    for (const c of search) {
      if (!n.kids[c]) { ok = false; F.push({ t: clone(root), path: [...path], msg: msg(`search "${search}": no child '${c}' → not found.`, `search "${search}": '${c}' child নেই → পাওয়া যায়নি।`) }); break; }
      n = n.kids[c]; path.push(n.id); F.push({ t: clone(root), path: [...path], msg: msg(`search "${search}": follow '${c}'.`, `search "${search}": '${c}' ধরে যাও।`) });
    }
    found = ok && n.end;
    if (ok) F.push({ t: clone(root), path, endAt: n.end ? n.id : undefined, msg: found ? msg(`"${search}" found — end mark present. O(length of word).`, `"${search}" পাওয়া গেছে — শেষ চিহ্ন আছে। O(শব্দের দৈর্ঘ্য)।`) : msg(`"${search}" is only a prefix, not a stored word.`, `"${search}" শুধু একটা prefix, পুরো শব্দ না।`) });
  }
  const count = (n) => 1 + Object.values(n.kids).reduce((s, k) => s + count(k), 0);
  F.push({ t: clone(root), done: true, msg: msg(`${count(root)} nodes for ${words.length} words — shared prefixes are stored once.`, `${words.length} টা শব্দে ${count(root)} টা node — একই prefix একবারই রাখা হয়।`) });
  return { frames: F, nodes: count(root), found };
}
