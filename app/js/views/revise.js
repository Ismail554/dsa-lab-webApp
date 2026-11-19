// Smart revision: due cards, past mistakes, decaying/weak topics — merged into one prioritised plan.
import { h, L, T, lang, icon, richInline } from "../ui.js";
import { store } from "../store.js";
import { TOPICS, topicById } from "../content/curriculum.js";
import { BANK } from "../content/bank.js";
import { gensForTopic } from "../content/generators.js";
import { pageHead, ring } from "./common.js";
import { allCards, session } from "./formulas.js";
import { questionCard } from "./question.js";
import { weakTopics } from "./progress.js";

export async function render(root) {
  const bn = lang() === "bn";
  const cards = await allCards(); const due = cards.filter((c) => store.cardDue(c.id));
  const solved = store.state.solved || {};
  const wrongIds = [...new Set(store.state.attempts.filter((a) => !a.ok && a.qid).map((a) => a.qid))].filter((id) => !solved[id] || solved[id] < (store.state.attempts.filter((a) => a.qid === id && !a.ok).pop()?.ts || 0));
  const mistakes = wrongIds.map((id) => BANK.find((q) => q.id === id)).filter(Boolean);
  const weak = weakTopics().slice(0, 5);

  root.append(pageHead(T("revise"), bn ? "স্মার্ট রিভিশন" : "Smart revision", bn ? "ভুলে যাওয়ার বক্ররেখা মাথায় রেখে: আজ যা দরকার শুধু সেটাই।" : "Built around the forgetting curve — only what you need today, in priority order."));
  const sprintHost = h("div");
  root.append(h("div.revise-grid",
    h("section.card.pad.rv", h("div.rv-n", String(due.length)), h("h3", bn ? "আজকের ফর্মুলা কার্ড" : "Cards due"), h("p.muted", bn ? "Leitner বক্স অনুযায়ী" : "Leitner spaced repetition"), h("a.btn.primary", { href: "#/formulas" }, bn ? "রিভিউ করো" : "Review cards")),
    h("section.card.pad.rv", h("div.rv-n", String(mistakes.length)), h("h3", bn ? "আগের ভুল" : "Mistakes to redo"), h("p.muted", bn ? "যেগুলো ভুল হয়েছিল, এখনো ঠিক হয়নি" : "Wrong before, not yet fixed"), mistakes.length ? h("a.btn", { href: `#/practice/q/${mistakes[0].id}` }, bn ? "প্রথমটা দিয়ে শুরু" : "Start with the first") : null),
    h("section.card.pad.rv", h("div.rv-n", String(weak.length)), h("h3", T("weak")), h("p.muted", bn ? "দক্ষতা কম বা অনেকদিন অনুশীলন হয়নি" : "Low mastery or fading from memory"), h("button.btn.primary", { onclick: () => sprint(sprintHost, due, mistakes, weak, bn) }, icon("play"), bn ? " ১০ মিনিটের স্প্রিন্ট" : " 10-minute sprint"))),
    sprintHost,
    h("section.card.pad", h("h3", bn ? "অগ্রাধিকার তালিকা" : "Priority list"),
      h("div.weak-list", weak.map((w) => { const t = topicById(w.id); return h("div.weak-row", ring(w.m, 40), h("div.grow", h("b", L(t.title)), h("small", w.reason)), h("a.btn.small", { href: `#/learn/${t.id}` }, bn ? "লেসন" : "Lesson"), h("a.btn.small.primary", { href: `#/practice/topic/${t.id}` }, bn ? "ড্রিল" : "Drill")); }))),
    mistakes.length ? h("section.card.pad", h("h3", bn ? "ভুলগুলো" : "Your mistakes"), h("div.qlist", mistakes.map((q) => h("a.qrow", { href: `#/practice/q/${q.id}` }, h("span.qstat.tried", "!"), h("span.qsrc", q.src), h("span.qtext", { html: richInline(q.q.slice(0, 140)) }))))) : null);
}

function sprint(host, due, mistakes, weak, bn) {
  // Interleave: card, mistake, weak-topic generated question …
  const items = [];
  const gens = weak.flatMap((w) => gensForTopic(w.id)); let gi = 0;
  for (let k = 0; k < 8; k++) {
    const r = k % 3;
    if (r === 0 && due[k]) items.push({ card: due[k] });
    else if (r === 1 && mistakes[k]) items.push({ q: mistakes[k] });
    else if (gens.length) { const g = gens[gi++ % gens.length]; items.push({ q: { ...g.make(), topic: g.topic, src: g.name, type: "auto", marks: 2 } }); }
  }
  let i = 0;
  const next = () => {
    if (i >= items.length) { host.replaceChildren(h("div.card.pad.center", h("h2", bn ? "স্প্রিন্ট শেষ! 💪" : "Sprint complete! 💪"), h("a.btn", { href: "#/progress" }, bn ? "অগ্রগতি দেখো" : "See progress"))); return; }
    const it = items[i++]; const head = h("div.sprint-head", h("b", `${bn ? "স্প্রিন্ট" : "Sprint"} ${i}/${items.length}`), h("button.btn.small", { onclick: next }, bn ? "বাদ দাও" : "Skip"));
    if (it.card) { const box = h("div"); host.replaceChildren(h("section.card.pad", head, box)); session(box, [it.card], bn, () => setTimeout(next, 300)); }
    else host.replaceChildren(h("section.card.pad", head, questionCard(it.q, { onResult: () => setTimeout(next, 1400) })));
    host.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  next();
}
