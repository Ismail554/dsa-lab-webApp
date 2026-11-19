// Practice hub: full exam-question bank, adaptive drills per topic, unlimited generated problems.
import { h, L, T, lang, icon, richInline } from "../ui.js";
import { store, docs } from "../store.js";
import { TOPICS, SETS, topicById } from "../content/curriculum.js";
import { BANK, bankById } from "../content/bank.js";
import { GENERATORS, gensForTopic } from "../content/generators.js";
import { questionCard } from "./question.js";
import { pageHead, ring } from "./common.js";
import { setTutorTopic } from "../tutor.js";

export async function render(root, [mode, arg]) {
  if (mode === "q") return single(root, bankById(arg));
  if (mode === "topic") return drill(root, arg);
  if (mode === "doc") return docDrill(root, arg);
  return hub(root);
}

const status = (q) => { const s = store.state.solved || {}; if (s[q.id]) return "solved"; return store.state.attempts.some((a) => a.qid === q.id) ? "tried" : "new"; };

function hub(root) {
  const bn = lang() === "bn";
  let filt = { set: "all", type: "all", st: "all" };
  root.append(pageHead(T("practice"), bn ? "পরীক্ষার প্রস্তুতি" : "Exam practice", bn ? `অ্যাসাইনমেন্টের সব প্রশ্ন (${BANK.length}টি) — উত্তর অটো-চেক, গাইডেড সমাধান, সংজ্ঞা/প্রমাণের রুব্রিক। আর আছে সীমাহীন নতুন সমস্যা।` : `All ${BANK.length} assignment & practice questions — auto-checked answers, guided solutions, rubrics for definitions/proofs — plus unlimited generated problems.`));

  const adaptive = h("section.card.pad.adaptive",
    h("div", h("h3", icon("target"), bn ? " অ্যাডাপটিভ ড্রিল" : " Adaptive drill"), h("p.muted", bn ? "তোমার দুর্বলতা অনুযায়ী প্রশ্ন বাছাই হবে।" : "Questions are chosen from your weakest topics first.")),
    h("div.chip-row", TOPICS.map((t) => h("a.topic-chip", { href: `#/practice/topic/${t.id}` }, ring(store.masteryOf(t.id), 26, false), L(t.title)))));

  const gens = h("section.card.pad", h("h3", icon("spark"), bn ? " সীমাহীন অনুশীলন জেনারেটর" : " Unlimited problem generators"),
    h("div.chip-row", GENERATORS.map((g) => h("a.chip", { href: `#/practice/topic/${g.topic}?gen=${g.id}` }, g.name))));

  const listBox = h("div.qlist");
  const filters = h("div.filters",
    seg([["all", bn ? "সব" : "All"], ["mid", bn ? "মিডটার্ম" : "Midterm"], ["fin", bn ? "ফাইনাল" : "Final"]], "set"),
    seg([["all", bn ? "সব ধরন" : "All types"], ["auto", bn ? "অটো-চেক" : "Auto-checked"], ["theory", bn ? "সংজ্ঞা/ব্যাখ্যা/কোড" : "Definitions/explain/code"]], "type"),
    seg([["all", bn ? "সব" : "Any status"], ["new", bn ? "নতুন" : "Not tried"], ["tried", bn ? "ভুল/অসম্পূর্ণ" : "Needs work"], ["solved", bn ? "সমাধান হয়েছে" : "Solved"]], "st"));
  function seg(opts, key) { const el = h("div.seg"); const draw = () => el.replaceChildren(...opts.map(([v, l]) => h("button", { class: filt[key] === v ? "on" : "", onclick: () => { filt[key] = v; draw(); drawList(); } }, l))); draw(); return el; }
  function drawList() {
    const qs = BANK.filter((q) => (filt.set === "all" || q.set === filt.set) && (filt.type === "all" || q.type === filt.type) && (filt.st === "all" || status(q) === filt.st));
    listBox.replaceChildren(...qs.map((q) => { const s = status(q); return h("a.qrow", { href: `#/practice/q/${q.id}` }, h(`span.qstat.${s}`, s === "solved" ? "✓" : s === "tried" ? "!" : ""), h("span.qsrc", q.src), h("span.qtext", { html: richInline(q.q.length > 140 ? q.q.slice(0, 140) + "…" : q.q) }), h("span.pill.small", L(topicById(q.topic).title))); }));
    if (!qs.length) listBox.append(h("p.muted", bn ? "কোনো প্রশ্ন নেই।" : "No questions match."));
  }
  drawList();
  root.append(h("div.practice-top", adaptive, gens), h("section.card.pad", h("h3", icon("pen"), bn ? " প্রশ্ন ব্যাংক" : " Question bank"), filters, listBox));
  docs.all().then((ds) => { const withQ = ds.filter((d) => d.analysis.questions.length); if (withQ.length) root.append(h("section.card.pad", h("h3", icon("upload"), bn ? " আপলোড করা উপকরণের প্রশ্ন" : " Questions from your uploaded materials"), h("div.chip-row", withQ.map((d) => h("a.chip", { href: `#/practice/doc/${d.id}` }, `${d.name} · ${d.analysis.questions.length}`))))); });
}

function single(root, q) {
  if (!q) { location.hash = "#/practice"; return; }
  const bn = lang() === "bn"; setTutorTopic(q.topic);
  const idx = BANK.indexOf(q);
  root.append(h("div.q-page-head", h("a.btn.small", { href: "#/practice" }, icon("left"), T("practice")), h("span.muted", `${idx + 1} / ${BANK.length}`),
    h("div.row", idx > 0 ? h("a.btn.small", { href: `#/practice/q/${BANK[idx - 1].id}` }, "←") : null, idx < BANK.length - 1 ? h("a.btn.small", { href: `#/practice/q/${BANK[idx + 1].id}` }, bn ? "পরের প্রশ্ন →" : "Next question →") : null)),
  questionCard(q));
}

function drill(root, topicId) {
  const t = topicById(topicId); if (!t) { location.hash = "#/practice"; return; }
  const bn = lang() === "bn"; setTutorTopic(t.id);
  const genPref = (location.hash.match(/gen=([\w-]+)/) || [])[1];
  let n = 0, right = 0;
  const score = h("span.drill-score"); const host = h("div.drill-host");
  root.append(pageHead(bn ? "অ্যাডাপটিভ ড্রিল" : "Adaptive drill", L(t.title), L(t.summary), h("div.drill-side", ring(store.masteryOf(t.id), 56), score)));
  root.append(host);
  const pool = () => {
    const bank = BANK.filter((q) => q.topic === t.id); const gens = gensForTopic(t.id);
    const unresolvedMisses = [...new Set(store.state.attempts.filter((a) => a.topic === t.id && !a.ok && a.qid).map((a) => a.qid))].map((id) => bank.find((q) => q.id === id)).filter((q) => q && status(q) !== "solved");
    if (genPref) { const g = GENERATORS.find((x) => x.id === genPref); if (g) return { ...g.make(), topic: g.topic, src: g.name, marks: 2, type: "auto" }; }
    if (unresolvedMisses.length && Math.random() < 0.55) return unresolvedMisses[Math.floor(Math.random() * unresolvedMisses.length)];
    const unsolved = bank.filter((q) => status(q) !== "solved");
    const roll = Math.random();
    if (unsolved.length && (roll < 0.55 || !gens.length)) return unsolved[Math.floor(Math.random() * unsolved.length)];
    if (gens.length) { const g = gens[Math.floor(Math.random() * gens.length)]; return { ...g.make(), topic: g.topic, src: `${bn ? "জেনারেটেড" : "Generated"} · ${g.name}`, marks: 2, type: "auto" }; }
    return bank[Math.floor(Math.random() * bank.length)];
  };
  const next = () => {
    const q = pool(); n++;
    const card = questionCard(q, { onResult: (ok) => { if (ok) right++; score.textContent = `${right}/${n}`; nextBtn.classList.add("pulse"); } });
    const nextBtn = h("button.btn.primary", { onclick: next }, bn ? "পরের প্রশ্ন →" : "Next question →");
    host.replaceChildren(card, h("div.row.center", nextBtn));
    score.textContent = `${right}/${n - 1}`;
  };
  next();
}

async function docDrill(root, id) {
  const bn = lang() === "bn"; const d = (await docs.all()).find((x) => x.id === id); if (!d) { location.hash = "#/practice"; return; }
  root.append(pageHead(bn ? "উপকরণ থেকে প্রশ্ন" : "From your materials", d.name, `${d.analysis.questions.length} ${bn ? "টি প্রশ্ন শনাক্ত হয়েছে" : "questions detected"}`));
  const topic = d.analysis.match[0] && d.analysis.match[0].id;
  for (const [k, q] of d.analysis.questions.entries()) {
    const ex = d.analysis.examples.find((e) => similar(e.q, q.q));
    root.append(questionCard({ id: `${d.id}-q${k}`, q: q.q, answer: ex ? ex.a.replace(/\n/g, "  \n") : null, topic, src: `${d.name} · Q${k + 1}`, type: "theory" }));
  }
}
const similar = (a, b) => { const w = (s) => new Set(s.toLowerCase().match(/[a-z0-9]+/g) || []); const A = w(a), B = w(b); let c = 0; A.forEach((x) => B.has(x) && c++); return c / Math.max(1, Math.min(A.size, B.size)) > 0.7; };
