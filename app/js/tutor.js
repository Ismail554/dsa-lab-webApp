// "Jarvis" — the Socratic tutor. Works fully offline (rule-based Socratic engine + DSA tools),
// and upgrades to a Claude-powered tutor when the local server has Anthropic credentials.
import { h, L, lang, richInline, icon, toast, texHTML } from "./ui.js";
import { store } from "./store.js";
import { TOPICS, topicById } from "./content/curriculum.js";
import { gensForTopic } from "./content/generators.js";
import { checkFields } from "./checker.js";
import * as D from "./dsa.js";

// ---------------- AI bridge ----------------
export const ai = {
  status: null,
  async check() { try { const r = await fetch("/api/status"); this.status = await r.json(); } catch { this.status = { ok: false, ai: false }; } return this.status; },
  get enabled() { return !!(this.status && this.status.ai) && store.state.aiOn !== false; },
  async ask(messages, system = "", { effort = "low", max_tokens = 1500 } = {}) {
    const r = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages, system, effort, max_tokens }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { if (r.status === 503) this.status = { ...(this.status || {}), ai: false }; throw new Error(j.error || `AI error ${r.status}`); }
    return j.text;
  },
};

export const KEYWORDS = {
  analysis: ["big-o", "big o", "omega", "theta", "asymptotic", "time complexity", "growth", "upper bound", "lower bound", "best case", "worst case", "loop"],
  space: ["space complexity", "auxiliary", "memory", "call stack", "stack frame", "space"],
  recurrence: ["recurrence", "substitution", "expansion", "sum of digits", "sumdigits", "t(n-1)", "t(n − 1)", "factorial", "back substitution"],
  master: ["master theorem", "master", "t(n/2)", "at(n/b)", "a t(n/b)", "case 1", "case 2", "case 3", "log log", "মাস্টার"],
  trees: ["binary tree", "full binary", "complete binary", "perfect binary", "traversal", "inorder", "in-order", "preorder", "pre-order", "postorder", "post-order", "height", "depth", "leaf", "2i+1", "parent index", "ট্রি"],
  heap: ["heap", "heapify", "priority queue", "max-heap", "min-heap", "max heap", "min heap", "build heap", "sift", "হিপ"],
  heapsort: ["heap sort", "heapsort"],
  avl: ["avl", "rotation", "balance factor", "rotate", "ll case", "rr case", "lr case", "rl case", "bst", "binary search tree"],
  btree: ["b-tree", "b tree", "btree", "b+ tree", "b+tree", "split", "order m", "disk"],
  graphs: ["graph", "adjacency", "vertex", "vertices", "edge", "degree", "directed", "undirected", "গ্রাফ"],
  bfsdfs: ["bfs", "dfs", "breadth", "depth-first", "depth first", "queue", "topological"],
  shortest: ["dijkstra", "bellman", "shortest path", "relax", "relaxation", "negative edge", "negative cycle"],
  mst: ["spanning tree", "mst", "prim", "kruskal", "union-find", "union find"],
  dnc: ["divide and conquer", "divide-and-conquer", "merge sort", "mergesort", "quick sort", "quicksort", "pivot", "partition"],
  "search-sort": ["binary search", "counting sort", "lower bound for sorting", "decision tree", "insertion sort", "searching"],
  greedy: ["greedy", "activity selection", "fractional knapsack", "huffman", "prefix code", "গ্রিডি"],
  "dp-basics": ["dynamic programming", "memoization", "memoisation", "tabulation", "fibonacci", "overlapping", "optimal substructure", "top-down", "bottom-up"],
  "dp-apps": ["0/1 knapsack", "knapsack", "lcs", "longest common subsequence", "matrix chain", "matrix-chain", "mcm"],
};
export function detectTopic(text) {
  const t = String(text).toLowerCase(); let best = null, bs = 0;
  for (const [id, kws] of Object.entries(KEYWORDS)) { const s = kws.reduce((a, k) => a + (t.includes(k.toLowerCase()) ? k.length : 0), 0); if (s > bs) { bs = s; best = id; } }
  return best;
}

// ---------------- Offline Socratic engine ----------------
const bn = () => lang() === "bn";
const say = (en, b) => (bn() ? b : en);

function questionsFor(topicId) {
  const t = topicById(topicId); if (!t) return [];
  const qs = t.steps.filter((s) => s.ask).map((s) => ({ ...s.ask, key: s.key, topic: topicId, body: s.body }));
  for (const g of gensForTopic(topicId)) qs.push({ gen: g, topic: topicId });
  return qs;
}

export class Jarvis {
  constructor() { this.topic = null; this.pending = null; this.asked = new Set(); }
  setTopic(id) { if (id) this.topic = id; }

  greet() {
    const t = this.topic && topicById(this.topic);
    return say(
      `Hi, I'm **Jarvis** 👋 I teach by asking questions. ${t ? `We're on **${L(t.title)}**.` : ""} Try **quiz me**, **explain heap**, **hint** — or use my tools: \`T(n)=2T(n/2)+n log n\`, \`bigo 3n^2+5n log n\`, \`heap 4 10 3 5 1\`.`,
      `হ্যালো, আমি **Jarvis** 👋 আমি প্রশ্ন করে শেখাই। ${t ? `আমরা এখন **${L(t.title)}** এ আছি।` : ""} লিখো **quiz me**, **explain heap**, **hint** — অথবা আমার tool ব্যবহার করো: \`T(n)=2T(n/2)+n log n\`, \`bigo 3n^2+5n log n\`, \`heap 4 10 3 5 1\`।`);
  }

  /** Offline DSA tools: Master Theorem solver, Big-O simplifier, heap / sort helpers. */
  tool(raw) {
    const s = raw.trim();
    const m = s.match(/^t\s*\(\s*n\s*\)\s*=\s*(\d*)\s*\*?\s*t\s*\(\s*n\s*\/\s*(\d+(?:\.\d+)?)\s*\)\s*\+\s*(.+)$/i);
    if (m) {
      const a = +(m[1] || 1), b = +m[2]; const g = D.growth(m[3]);
      if (!g) return say("I couldn't read the f(n) part — try `n log n`, `n^2`, `n/log n`.", "f(n) অংশটা পড়তে পারিনি — `n log n`, `n^2`, `n/log n` এভাবে লেখো।");
      if (g.E || g.F || g.q) return say("f(n) must look like nᵏ logᵖ n for the Extended Master Theorem — use a recursion tree instead.", "Extended Master Theorem এর জন্য f(n) কে nᵏ logᵖ n আকারে হতে হবে — এখানে recursion tree ব্যবহার করো।");
      const k = g.c !== null ? 0 : g.k, p = g.c !== null ? 0 : g.p; const r = D.master(a, b, k, p);
      return [`$a=${a},\\ b=${b},\\ k=${+k.toFixed(3)},\\ p=${+p.toFixed(3)},\\ b^k=${+r.bk.toFixed(3)}$`, L(r.why), `**Case ${r.kase}:** $T(n)=${r.tex}$`, say("🧭 Before trusting me: which level of the recursion tree does the most work here? Check it in the **Recursion Tree & Master Theorem Lab**.", "🧭 আমাকে বিশ্বাস করার আগে: recursion tree এর কোন level সবচেয়ে বেশি কাজ করে? **Recursion Tree ও Master Theorem ল্যাবে** মিলিয়ে দেখো।")].join("\n\n");
    }
    const bo = s.match(/^(bigo|big-o|simplify|theta|complexity|θ)\s+(.+)$/i);
    if (bo) { const g = D.growth(bo[2]); return g ? `$${bo[2].replace(/\*/g, "\\cdot ")}=\\Theta(${D.growthTex(g)})$\n\n${say("Keep the fastest-growing term, drop constants. 🧭 Which term did you expect to win?", "সবচেয়ে দ্রুত বাড়া পদটা রাখো, constant বাদ। 🧭 তুমি কোন পদটা জিতবে ভেবেছিলে?")}` : say("Couldn't read that expression.", "Expression টা পড়তে পারিনি।"); }
    const hp = s.match(/^(max-?heap|min-?heap|heap|heapsort|heap sort|sort)\s+([-\d,\s]+)$/i);
    if (hp) {
      const a = hp[2].split(/[\s,]+/).filter(Boolean).map(Number).slice(0, 20); const kind = hp[1].toLowerCase();
      if (/sort/.test(kind)) { const r = D.mergeSort(a); return `Sorted: $[${r.result.join(", ")}]$ — merge sort used ${r.comps} ${say("comparisons", "টা তুলনা")}.\n\n🧭 n log₂ n = ${Math.round(a.length * Math.log2(a.length))} — ${say("is the count close?", "সংখ্যাটা কি কাছাকাছি?")}`; }
      const type = /min/.test(kind) ? "min" : "max"; const r = D.buildHeap(a, type);
      return `Bottom-up ${type}-heap: $[${r.result.join(", ")}]$ (${r.swaps} swaps). ${say(`Before: ${D.heapKind(a)} heap.`, `আগে ছিল: ${D.heapKind(a)} heap।`)}\n\n${say("🧭 Which index did heapify start from, and why that one?", "🧭 Heapify কোন index থেকে শুরু হয়েছিল, আর কেন সেখান থেকে?")}`;
    }
    return null;
  }

  ask(topicId = this.topic) {
    const tid = topicId || pickWeakTopic(); this.topic = tid;
    let qs = questionsFor(tid).filter((q, k) => !this.asked.has(`${tid}:${k}`));
    if (!qs.length) { this.asked.clear(); qs = questionsFor(tid); }
    const all = questionsFor(tid); const q = qs[Math.floor(Math.random() * qs.length)]; this.asked.add(`${tid}:${all.indexOf(q)}`);
    let p;
    if (q.gen) { const m = q.gen.make(); p = { type: "input", q: m.q, fields: m.fields, solution: m.solution, topic: tid, hints: [say("Write down the formula you'd use first. Which one is it?", "প্রথমে কোন সূত্র লাগবে সেটা লেখো। কোনটা?"), ...m.solution.slice(0, -1)] }; }
    else p = { ...q, hints: [L(q.hint) || say(`Think about this: ${L(q.key)}`, `এটা ভাবো: ${L(q.key)}`), L(q.key), L(q.body)].filter(Boolean) };
    p.hintIdx = 0; this.pending = p;
    const opts = p.type === "mcq" ? "\n" + p.options.map((o, k) => `**${"ABCD"[k]}.** ${L(o)}`).join("\n") : p.fields.length > 1 ? say(`\n_(answer as: ${p.fields.map((f) => f.label).join(", ")} — separated by commas)_`, `\n_(উত্তর দাও: ${p.fields.map((f) => f.label).join(", ")} — কমা দিয়ে আলাদা করে)_`) : "";
    return `${say("🤔 **Question:**", "🤔 **প্রশ্ন:**")} ${L(p.q)}${opts}`;
  }

  reply(text) {
    const raw = String(text).trim(); const lo = raw.toLowerCase();
    const wantsHint = /^(hint|help|i don'?t know|idk|জানি না|হিন্ট|সাহায্য|bujhi na|বুঝি না|pari na|পারি না)\b/i.test(lo);
    const wantsQuiz = /(quiz|ask me|test me|question|প্রশ্ন|কুইজ|practice)/i.test(lo);
    const wantsExplain = /^(explain|why|what is|what's|বোঝাও|বুঝিয়ে|কী|কি|keno|ki)\b/i.test(lo) || /(explain|বোঝাও|বুঝিয়ে)/i.test(lo);
    const skip = /^(skip|next|পরের|বাদ)/i.test(lo);

    // offline tools (only when not answering a pending question)
    if (!this.pending || /^(t\s*\(|bigo|simplify|heap|sort)/i.test(lo)) { const out = this.tool(raw); if (out) { this.pending = null; return out; } }

    // switching subject mid-question ("explain conjugate") abandons the pending question
    if (this.pending && (wantsExplain || (/[a-z]{3,}\s+[a-z]{3,}/i.test(raw) && detectTopic(raw) && detectTopic(raw) !== this.pending.topic))) this.pending = null;
    if (this.pending) {
      const p = this.pending;
      if (skip) { this.pending = null; return say("Skipped. ", "বাদ দিলাম। ") + this.ask(); }
      if (wantsHint) {
        if (p.hintIdx < p.hints.length) return `💡 ${say("Hint", "হিন্ট")} ${p.hintIdx + 1}: ${p.hints[p.hintIdx++]}`;
        this.pending = null; store.record(p.topic, false, { kind: "socratic", weight: 0.5 });
        const sol = p.solution ? p.solution.join("\n") : p.type === "mcq" ? `**${L(p.options[p.answer])}** — ${L(p.why)}` : `${p.fields.map((f) => `${f.label} = $${texSafe(f.ans)}$`).join(", ")}. ${L(p.why)}`;
        return `${say("Here is the full solution:", "সম্পূর্ণ সমাধান:")}\n${sol}\n\n${say("Now explain the key step back to me in one sentence (Feynman!) — or say **quiz me** for another.", "এবার মূল ধাপটা এক বাক্যে আমাকে বুঝিয়ে বলো (Feynman!) — অথবা **quiz me** লিখো।")}`;
      }
      if (wantsQuiz) { this.pending = null; return this.ask(detectTopic(raw) || this.topic); }
      // grade
      let ok = false;
      if (p.type === "mcq") {
        const k = /^[a-d]\b/i.test(raw) ? "abcd".indexOf(raw[0].toLowerCase()) : /^\d$/.test(raw) ? +raw - 1 : p.options.findIndex((o) => L(o).toLowerCase().replace(/\$/g, "").includes(lo.replace(/\$/g, "")));
        ok = k === p.answer;
      } else {
        const parts = p.fields.length > 1 ? raw.split(/[,;]|\band\b|এবং/).map((s) => s.trim()) : [raw];
        ok = checkFields(p.fields, parts).ok;
      }
      if (ok) {
        this.pending = null; store.record(p.topic, true, { kind: "socratic", weight: 0.6 });
        const follow = [say("Why does that work? Say it in your own words.", "এটা কেন কাজ করে? নিজের ভাষায় বলো।"), say("Could you have predicted it from the picture in the lab?", "ল্যাবের ছবি দেখে আগেই অনুমান করতে পারতে?"), say("What would change if n doubled?", "n দ্বিগুণ হলে কী বদলাতো?")];
        return `✅ ${say("Correct!", "সঠিক!")} ${p.why ? L(p.why) : p.solution ? p.solution[p.solution.length - 1] : ""}\n\n🧭 ${follow[Math.floor(Math.random() * follow.length)]} ${say("Or type **quiz me** for the next question.", "অথবা পরের প্রশ্নের জন্য **quiz me** লিখো।")}`;
      }
      store.record(p.topic, false, { kind: "socratic", weight: 0.4 });
      const nudge = p.hintIdx < p.hints.length ? `\n💡 ${p.hints[p.hintIdx++]}` : "";
      return `${say("Not quite — let's reason it out.", "পুরোপুরি ঠিক হয়নি — চলো যুক্তি দিয়ে ভাবি।")}${nudge}\n${say("Try again, or type **hint** / **skip**.", "আবার চেষ্টা করো, অথবা **hint** / **skip** লিখো।")}`;
    }

    const tid = detectTopic(raw) || (wantsQuiz || wantsExplain ? this.topic : null);
    if (wantsQuiz) return this.ask(tid || this.topic);
    if (tid) {
      this.topic = tid; const t = topicById(tid); const st = t.steps[0];
      const f = t.formulas[0];
      const idea = t.steps.find((x) => !x.story) || st;
      return `📖 **${L(st.title)}**\n\n${L(st.body)}\n\n**${L(t.title)}** — ${L(t.summary)}\n\n$$${f.tex}$$\n${L(idea.key)}\n\n🧭 ${say("Before I say more — what do you *think* the picture looks like? Answer this:", "আরো বলার আগে — তুমি কী *মনে করো*? এটার উত্তর দাও:")}\n\n${this.ask(tid)}`;
    }
    return say(
      "I couldn't match that to a topic yet. Try naming one (e.g. *heap*, *AVL*, *Dijkstra*, *Master Theorem*, *LCS*), use a tool like `T(n)=2T(n/2)+n`, or say **quiz me**.",
      "এটা কোনো টপিকের সাথে মেলাতে পারিনি। একটা টপিকের নাম লেখো (যেমন *heap*, *AVL*, *Dijkstra*, *Master Theorem*, *LCS*), `T(n)=2T(n/2)+n` এর মতো tool ব্যবহার করো, অথবা **quiz me** বলো।");
  }
}
const texSafe = (s) => String(s).replace(/\*/g, "\\cdot ");

export function pickWeakTopic() {
  const scored = TOPICS.map((t) => ({ id: t.id, m: store.masteryOf(t.id) + Math.random() * 0.08 }));
  scored.sort((a, b) => a.m - b.m); return scored[0].id;
}

// ---------------- Chat drawer UI ----------------
let drawer, log, input, jarvis, history = [], currentTopic = null;
export function setTutorTopic(id) { currentTopic = id; if (jarvis) jarvis.setTopic(id); }

export function openTutor(prefill) {
  if (!drawer) buildDrawer();
  drawer.classList.add("open"); document.body.classList.add("tutor-open");
  if (prefill) { input.value = prefill; send(); }
  setTimeout(() => input.focus(), 50);
}
export function closeTutor() { drawer && drawer.classList.remove("open"); document.body.classList.remove("tutor-open"); }

function buildDrawer() {
  jarvis = new Jarvis(); jarvis.setTopic(currentTopic);
  log = h("div.chat-log", { "aria-live": "polite" });
  input = h("textarea.chat-input", { rows: 2, placeholder: lang() === "bn" ? "জার্ভিসকে লিখো… (Enter = পাঠাও)" : "Message Jarvis… (Enter to send)" });
  input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } });
  const modeBadge = h("span.ai-badge");
  const refreshBadge = () => { modeBadge.textContent = ai.enabled ? (ai.status.provider === "gemini" ? "Gemini AI" : "Claude AI") : "offline Socratic"; modeBadge.className = "ai-badge " + (ai.enabled ? "on" : "off"); };
  const chips = h("div.chat-chips", ["quiz me", "hint", "explain", "T(n)=2T(n/2)+n log n", "heap 4 10 3 5 1"].map((c) => h("button.chip", { onclick: () => { input.value = c; send(); } }, c)));
  drawer = h("aside#tutor.drawer", { "aria-label": "Jarvis tutor" },
    h("header.drawer-head", h("div.jarvis-avatar", "J"), h("div", h("b", "Jarvis"), h("small", lang() === "bn" ? "সক্রেটিক টিউটর" : "Socratic tutor")), modeBadge,
      h("button.icon-btn", { title: "Toggle AI", onclick: () => { store.set({ aiOn: store.state.aiOn === false }); refreshBadge(); if (!ai.status?.ai) toast(lang() === "bn" ? "AI চালু করতে Vercel Environment Variables-এ GEMINI_API_KEY যোগ করে redeploy করুন" : "Set GEMINI_API_KEY in Vercel Project Settings → Environment Variables, then redeploy.", "info", 5000); } }, icon("spark")),
      h("button.icon-btn", { title: "Close", onclick: closeTutor }, icon("x"))),
    log, chips, h("div.chat-row", input, h("button.btn.primary", { onclick: send }, icon("arrow"))));
  document.body.append(drawer); refreshBadge();
  ai.check().then(refreshBadge);
  push("jarvis", jarvis.greet());
}

function push(role, md) {
  const el = h(`div.msg.${role}`, { html: richInline(md) }); log.append(el); log.scrollTop = log.scrollHeight; return el;
}

async function send() {
  const text = input.value.trim(); if (!text) return; input.value = "";
  push("me", text.replace(/[<>]/g, "")); jarvis.setTopic(currentTopic);
  if (ai.enabled) {
    history.push({ role: "user", content: text }); const wait = push("jarvis", "…");
    const t = currentTopic && topicById(currentTopic);
    const weak = TOPICS.map((x) => ({ x, m: store.masteryOf(x.id) })).sort((a, b) => a.m - b.m).slice(0, 4);
    const sys = [
      `- উত্তরের ভাষা: ${lang() === "bn" ? "বাংলা (বাংলা হরফ, গাণিতিক পরিভাষা ইংরেজিতে)" : "English"} — তবে শিক্ষার্থী যে ভাষায় লেখে সেটাকে অগ্রাধিকার দাও।`,
      t ? `- শিক্ষার্থী এখন এই লেসনে আছে: ${t.title.bn} (${t.title.en}) — ${t.summary.bn}\n- এই টপিকের মূল সূত্র: ${t.formulas.map((f) => `$${f.tex}$`).join(" ; ")}` : "- শিক্ষার্থী এখন কোনো নির্দিষ্ট লেসনে নেই।",
      `- অ্যাপের পেজ: ${location.hash || "#/"}`,
      `- দুর্বল টপিক (mastery 0–1): ${weak.map(({ x, m }) => `${x.title.en} ${m.toFixed(2)}`).join(", ")}`,
    ].join("\n");
    try { const ans = await ai.ask(history.slice(-12), sys); history.push({ role: "assistant", content: ans }); wait.innerHTML = richInline(ans); }
    catch (e) { history.pop(); wait.innerHTML = richInline(`_(${e.message} — switching to offline mode)_\n\n${jarvis.reply(text)}`); }
    log.scrollTop = log.scrollHeight; return;
  }
  push("jarvis", jarvis.reply(text));
}
