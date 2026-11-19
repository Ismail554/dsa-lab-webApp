import { h, L, T, lang, icon, richInline } from "../ui.js";
import { store } from "../store.js";
import { TOPICS, SETS, topicsOfSet, topicById } from "../content/curriculum.js";
import { labById } from "../labs/index.js";
import { ring, topicCard } from "./common.js";
import { BANK } from "../content/bank.js";
import { openTutor, pickWeakTopic } from "../tutor.js";

export function render(root) {
  const bn = lang() === "bn";
  const st = store.state;
  const last = Object.entries(st.lessons).sort((a, b) => (b[1].ts || 0) - (a[1].ts || 0))[0];
  const nextTopic = last && !last[1].done ? topicById(last[0]) : TOPICS.find((t) => !(st.lessons[t.id] && st.lessons[t.id].done)) || TOPICS[0];
  const overall = TOPICS.reduce((a, t) => a + store.masteryOf(t.id), 0) / TOPICS.length;
  const weak = pickWeakTopic();
  const attempts = st.attempts.length; const acc = attempts ? st.attempts.filter((a) => a.ok).length / attempts : 0;

  const heroLab = h("div.hero-lab");
  const hero = h("section.hero.card",
    h("div.hero-copy",
      h("div.kicker", "CSE 2205 · Data Structures & Algorithms II"),
      h("h1", { html: bn ? "যেখানে algorithm <mark>চোখের সামনে</mark> চলে" : "A laboratory where algorithms <mark>run in front of you</mark>" }),
      h("p.sub", bn ? "ধাপে ধাপে চালাও, অনুমান করো, তারপর পরীক্ষার জন্য প্রস্তুত হও। Heap, AVL, B-tree, graph, sorting, greedy আর DP — প্রতিটা ধারণার পাশে লাইভ ভিজ্যুয়ালাইজেশন, সক্রেটিক প্রশ্ন, গাইডেড সমাধান আর smart revision।" : "Step through, predict, then prove it in the exam. Heaps, AVL and B-trees, graphs, sorting, greedy and DP — every idea has a live step-by-step visual, Socratic questions, guided exam solutions and a revision plan that adapts to you."),
      h("div.hero-cta",
        h("a.btn.primary.big", { href: `#/learn/${nextTopic.id}` }, icon("play"), h("span", `${last ? T("continue") : T("start")}: ${L(nextTopic.title)}`)),
        h("a.btn.big", { href: "#/exam" }, icon("clock"), h("span", T("exam"))),
        h("button.btn.big.ghost", { onclick: () => openTutor("quiz me") }, icon("chat"), h("span", bn ? "Jarvis quiz" : "Socratic quiz with Jarvis"))),
      h("div.hero-stats",
        stat(ring(overall, 46), bn ? "সামগ্রিক দক্ষতা" : "overall mastery"),
        stat(h("b.big-num", String(store.streak())), bn ? "দিনের স্ট্রিক" : "day streak"),
        stat(h("b.big-num", `${Math.round(acc * 100)}%`), bn ? `${attempts} চেষ্টায় সঠিক` : `accuracy · ${attempts} tries`),
        stat(h("b.big-num", String(BANK.length)), bn ? "পরীক্ষার প্রশ্ন" : "exam questions"))),
    heroLab);

  const plan = h("section.card.pad.plan",
    h("h3", icon("target"), bn ? " আজকের পরিকল্পনা" : " Today's plan"),
    h("ol.plan-list",
      h("li", h("a", { href: `#/learn/${nextTopic.id}` }, bn ? "লেসন: " : "Lesson: ", h("b", L(nextTopic.title)))),
      h("li", h("a", { href: `#/practice/topic/${weak}` }, bn ? "দুর্বল টপিক অনুশীলন: " : "Fix a weak spot: ", h("b", L(topicById(weak).title)))),
      h("li", h("a", { href: "#/revise" }, bn ? "স্মার্ট রিভিশন (ফর্মুলা কার্ড + ভুলগুলো)" : "Smart revision — due cards & past mistakes")),
      h("li", h("a", { href: "#/exam" }, bn ? "১৫ মিনিটের মিনি মক টেস্ট" : "A 15-minute mini mock test"))));

  const sets = SETS.map((s) => h("section.set-block",
    h("div.set-head", h("span.pill.violet", s.code), h("h2", L(s.title))),
    h("div.topic-grid", topicsOfSet(s.id).map((t) => topicCard(t)))));

  const labsRow = h("section", h("div.set-head", h("span.pill.green", T("labs")), h("h2", bn ? "ইন্টারঅ্যাকটিভ ল্যাব" : "Interactive labs")),
    h("div.lab-strip", ["heap", "graph", "recursion", "avl", "sort", "dp"].map((id) => { const lb = labById(id); return h("a.lab-chip", { href: `#/labs/${id}` }, icon(lb.icon), h("b", L(lb.title)), h("small", L(lb.blurb).slice(0, 88) + "…")); })));

  root.append(hero, h("div.home-grid", plan, howItWorks(bn)), labsRow, ...sets);

  // live hero visual: a heap being built, looping
  const lab = labById("heap").mount(heroLab, { op: "build", arr: [12, 35, 7, 50, 21, 44, 3, 28], compact: true });
  let paused = false; heroLab.addEventListener("pointerdown", () => { paused = true; }, { once: true });
  const id = setInterval(() => { if (document.hidden || paused) return; const P = lab.player; if (P.i >= P.n - 1) lab.set({ arr: Array.from({ length: 8 }, () => 2 + Math.floor(Math.random() * 97)), op: "build" }); else P.go(P.i + 1); }, 1100);
  return { destroy() { clearInterval(id); lab.destroy(); } };
}
const stat = (v, l) => h("div.stat", v, h("small", l));
function howItWorks(bn) {
  const items = bn
    ? [["1", "দেখো", "প্রতিটা ধারণা একটা লাইভ ভিজ্যুয়াল দিয়ে শুরু।"], ["2", "অনুমান করো", "সক্রেটিক প্রশ্নের উত্তর না দিলে সামনে যাওয়া যায় না।"], ["3", "বুঝিয়ে বলো", "Feynman পদ্ধতি: নিজের ভাষায় লিখো, অ্যাপ মূল্যায়ন করবে।"], ["4", "পরীক্ষা দাও", "মক টেস্ট, গাইডেড সমাধান, দুর্বল টপিক শনাক্তকরণ।"]]
    : [["1", "See it", "Every idea starts with a live, draggable visual."], ["2", "Predict", "Socratic checkpoints gate each step — think before you read on."], ["3", "Explain it back", "Feynman technique: write it simply; the app scores your explanation."], ["4", "Prove it in exams", "Mock tests, guided solutions, weak-topic detection, spaced revision."]];
  return h("section.card.pad.how", h("h3", icon("bulb"), bn ? " কীভাবে শিখবে" : " How you'll learn"), h("div.how-grid", items.map(([n, a, b]) => h("div.how-item", h("span.how-n", n), h("b", a), h("p", b)))));
}
