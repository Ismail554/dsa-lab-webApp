// Timed mock tests with automatic marking, per-topic breakdown and review.
import { h, L, T, lang, icon, richInline, confetti, fmtDate } from "../ui.js";
import { store } from "../store.js";
import { TOPICS, SETS, topicById } from "../content/curriculum.js";
import { BANK } from "../content/bank.js";
import { GENERATORS } from "../content/generators.js";
import { questionCard } from "./question.js";
import { pageHead, ring } from "./common.js";

const PRESETS = [
  { id: "mini", n: 6, min: 15, theory: 1, en: "Mini quiz", bn: "মিনি কুইজ" },
  { id: "mid", n: 10, min: 35, theory: 3, en: "Class test", bn: "ক্লাস টেস্ট" },
  { id: "final", n: 14, min: 60, theory: 5, en: "Full mock exam", bn: "পূর্ণ মক পরীক্ষা" },
];

let timer = null;
export function render(root) {
  const bn = lang() === "bn";
  let cfg = { set: "all", preset: "mini", weak: true };
  root.append(pageHead(T("exam"), bn ? "মক টেস্ট" : "Mock test", bn ? "সময় ধরে পরীক্ষা দাও। গাণিতিক উত্তর অটো-মার্ক হবে, সংজ্ঞা/প্রমাণ রুব্রিক দিয়ে। শেষে টপিক-ভিত্তিক বিশ্লেষণ পাবে।" : "Timed, exam-style. Numerical answers are auto-marked; definitions and proofs are marked against key-point rubrics. You get a per-topic breakdown at the end."));
  const setup = h("section.card.pad.exam-setup");
  const drawSetup = () => setup.replaceChildren(
    h("h3", bn ? "পরীক্ষা সাজাও" : "Configure"),
    h("div.exam-presets", PRESETS.map((p) => h("button.preset", { class: cfg.preset === p.id ? "on" : "", onclick: () => { cfg.preset = p.id; drawSetup(); } }, h("b", bn ? p.bn : p.en), h("span", `${p.n} ${bn ? "প্রশ্ন" : "questions"} · ${p.min} min`)))),
    h("div.seg", [["all", bn ? "দুই সেট" : "Both sets"], ...SETS.map((s) => [s.id, s.code])].map(([v, l]) => h("button", { class: cfg.set === v ? "on" : "", onclick: () => { cfg.set = v; drawSetup(); } }, l))),
    h("label.toggle", h("input", { type: "checkbox", checked: cfg.weak, onchange: (e) => (cfg.weak = e.target.checked) }), h("span.track", h("span.knob")), h("span", bn ? "দুর্বল টপিকে বেশি গুরুত্ব" : "Focus on my weak topics")),
    h("button.btn.primary.big", { onclick: () => start(root, cfg) }, icon("play"), bn ? " শুরু করো" : " Start test"));
  drawSetup();
  const past = store.state.exams.slice(-8).reverse();
  root.append(...[setup, past.length ? h("section.card.pad", h("h3", bn ? "আগের ফলাফল" : "Previous attempts"), h("div.exam-history", past.map((e) => h("div.eh", ring(e.pct / 100, 40), h("div", h("b", `${Math.round(e.pct)}%`), h("small", `${fmtDate(e.ts)} · ${e.score.toFixed(1)}/${e.total}`)))))) : null].filter(Boolean));
  return { destroy() { clearInterval(timer); } };
}

function pickQuestions(cfg) {
  const p = PRESETS.find((x) => x.id === cfg.preset);
  const inSet = (q) => cfg.set === "all" || q.set === cfg.set;
  const w = (q) => (cfg.weak ? 1.4 - store.masteryOf(q.topic) : 1) * (0.6 + Math.random());
  const pickW = (arr, k) => arr.map((q) => [w(q), q]).sort((a, b) => b[0] - a[0]).slice(0, k).map((x) => x[1]);
  const theory = pickW(BANK.filter((q) => inSet(q) && q.type === "theory"), p.theory);
  const autos = pickW(BANK.filter((q) => inSet(q) && q.type === "auto"), Math.ceil((p.n - p.theory) * 0.6));
  const gens = GENERATORS.filter((g) => cfg.set === "all" || topicById(g.topic).set === cfg.set);
  const need = p.n - theory.length - autos.length; const genQs = [];
  for (let k = 0; k < need; k++) { const g = gens[Math.floor(Math.random() * gens.length)]; genQs.push({ ...g.make(), id: null, topic: g.topic, src: g.name, marks: 2, type: "auto" }); }
  return { list: [...autos, ...genQs, ...theory], p };
}

function start(root, cfg) {
  const bn = lang() === "bn";
  const { list, p } = pickQuestions(cfg);
  const cards = list.map((q, k) => { const c = questionCard(q, { mode: "exam" }); c.prepend(h("div.q-num", `Q${k + 1}`)); return c; });
  const total = list.reduce((a, q) => a + (q.marks || 2), 0);
  let left = p.min * 60; const clock = h("b.clock");
  const tick = () => { const m = Math.floor(left / 60), s = left % 60; clock.textContent = `${m}:${String(s).padStart(2, "0")}`; clock.classList.toggle("urgent", left < 120); if (left-- <= 0) submit(); };
  const bar = h("div.exam-bar.card", h("span", icon("clock"), " ", clock), h("span.muted", `${list.length} ${bn ? "প্রশ্ন" : "questions"} · ${total} ${bn ? "নম্বর" : "marks"}`), h("button.btn.primary", { onclick: () => { if (confirm(bn ? "জমা দেবে?" : "Submit the test?")) submit(); } }, bn ? "জমা দাও" : "Submit"));
  root.replaceChildren(bar, h("div.exam-qs", cards), h("div.row.center", h("button.btn.primary.big", { onclick: submit }, bn ? "জমা দাও ও মার্ক দেখো" : "Submit & see marks")));
  tick(); clearInterval(timer); timer = setInterval(tick, 1000);

  function submit() {
    clearInterval(timer);
    let score = 0; const byTopic = {};
    list.forEach((q, k) => {
      const st = cards[k].state; const frac = st.result ? st.result.frac : 0; const m = q.marks || 2; score += frac * m;
      const b = (byTopic[q.topic] = byTopic[q.topic] || { got: 0, max: 0 }); b.got += frac * m; b.max += m;
      store.record(q.topic, frac >= 0.6, { qid: q.id, kind: "exam", weight: 1.1 });
      if (frac >= 0.99 && q.id) store.set({ solved: { ...(store.state.solved || {}), [q.id]: Date.now() } });
    });
    const pct = (100 * score) / total;
    store.set({ exams: [...store.state.exams, { ts: Date.now(), score, total, pct, byTopic, set: cfg.set }] });
    if (pct >= 70) confetti();
    const grade = pct >= 80 ? "A+" : pct >= 75 ? "A" : pct >= 70 ? "A-" : pct >= 65 ? "B+" : pct >= 60 ? "B" : pct >= 50 ? "C" : pct >= 40 ? "D" : "F";
    const rows = Object.entries(byTopic).sort((a, b) => a[1].got / a[1].max - b[1].got / b[1].max);
    root.replaceChildren(
      h("section.card.pad.result-hero", ring(pct / 100, 96), h("div", h("div.kicker", bn ? "ফলাফল" : "Result"), h("h1", `${score.toFixed(1)} / ${total}`), h("p.sub", `${Math.round(pct)}% · ${bn ? "গ্রেড (আনুমানিক)" : "approx. grade"} ${grade}`)),
        h("div.row", h("a.btn.primary", { href: "#/revise" }, bn ? "দুর্বল জায়গা রিভিশন" : "Revise weak spots"), h("button.btn", { onclick: () => render(root.replaceChildren() || root) }, bn ? "আরেকটা টেস্ট" : "Another test"))),
      h("section.card.pad", h("h3", bn ? "টপিক অনুযায়ী" : "By topic"), h("div.bytopic", rows.map(([tid, b]) => { const f = b.got / b.max; return h("a.bt-row", { href: `#/practice/topic/${tid}` }, h("span", L(topicById(tid).title)), h("span.bar", h("i", { style: { width: `${f * 100}%`, background: f >= 0.7 ? "var(--green-3)" : f >= 0.4 ? "var(--gold)" : "var(--rust)" } })), h("b", `${b.got.toFixed(1)}/${b.max}`)); }))),
      h("h3.review-h", bn ? "উত্তর পর্যালোচনা" : "Review"),
      ...list.map((q, k) => review(q, cards[k].state, k)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function review(q, st, k) {
  const bn = lang() === "bn"; const frac = st.result ? st.result.frac : 0; const m = q.marks || 2;
  return h("article.card.pad.review", { class: frac >= 0.99 ? "good" : frac > 0 ? "part" : "bad" },
    h("div.q-head", h("b", `Q${k + 1}`), h("span.pill.small", q.src || ""), h("span.pill.gold", `${(frac * m).toFixed(1)}/${m}`)),
    h("div.q-stmt", { html: richInline(q.q) }),
    h("div.your", h("small", bn ? "তোমার উত্তর: " : "Your answer: "), h("span", Array.isArray(st.value) ? st.value.join(" · ") : st.value || "—")),
    q.fields ? h("div.model", h("b", bn ? "সঠিক উত্তর: " : "Correct: "), h("span", { html: richInline(q.fields.map((f) => `${f.label} = $${f.ans.replace(/\*/g, "")}$`).join(", ")) }), q.solution ? h("ol.guided", q.solution.map((s) => h("li", { html: richInline(s) }))) : null)
      : h("div.model", h("b", bn ? "মডেল উত্তর" : "Model answer"), h("div", { html: richInline(q.answer || "") })),
    q.id ? h("a.btn.small", { href: `#/practice/q/${q.id}` }, bn ? "আবার চেষ্টা" : "Retry this question") : null);
}
