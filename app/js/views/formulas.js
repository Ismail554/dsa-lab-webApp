// Formula & definition flashcards with Leitner spaced repetition, plus a printable cheat sheet.
import { h, L, T, lang, icon, texHTML, richInline, confetti } from "../ui.js";
import { store, docs } from "../store.js";
import { TOPICS, SETS, topicById } from "../content/curriculum.js";
import { pageHead } from "./common.js";

export async function allCards() {
  const cards = TOPICS.flatMap((t) => t.formulas.map((f) => ({ id: `f:${t.id}:${f.id}`, topic: t.id, front: L(f.name), back: `$$${f.tex}$$`, kind: "formula" })));
  for (const d of await docs.all()) {
    if (d.analysis.isCore) continue;
    const topic = d.analysis.match[0] ? d.analysis.match[0].id : null;
    d.analysis.defs.forEach((s, k) => {
      const m = s.match(/^(.*?)\b(is called|are called|is known as|is said to be)\s+(an?\s+|the\s+)?(.{3,60}?)(?:[.,;]|\s+of\b|\s+if\b|\s+and\b|$)/i);
      if (m) cards.push({ id: `d:${d.id}:${k}`, topic, front: s.replace(m[4], "_____"), back: m[4], kind: "definition", doc: d.name });
    });
  }
  return cards;
}

export async function render(root, [topicFilter]) {
  const bn = lang() === "bn";
  const cards = await allCards();
  let mode = topicFilter ? "topic" : "due";
  root.append(pageHead(T("formulas"), bn ? "ফর্মুলা কার্ড" : "Formula cards", bn ? "স্পেসড রিপিটিশন: যেটা ভুলে যাও সেটা দ্রুত ফিরে আসে, যেটা মনে থাকে সেটা দেরিতে।" : "Spaced repetition: cards you forget come back soon, cards you know come back later."));
  const area = h("div");
  const tabs = h("div.seg", [["due", bn ? "আজকের কার্ড" : "Due today"], ["all", bn ? "সব কার্ড" : "All cards"], ["sheet", bn ? "চিট শিট" : "Cheat sheet"]].map(([v, l]) => h("button", { class: mode === v ? "on" : "", onclick: (e) => { mode = v; tabs.querySelectorAll("button").forEach((b) => b.classList.remove("on")); e.currentTarget.classList.add("on"); draw(); } }, l)));
  root.append(h("div.row", tabs), area);
  function draw() {
    if (mode === "sheet") return sheet(area, bn);
    const pool = mode === "topic" ? cards.filter((c) => c.topic === topicFilter) : mode === "due" ? cards.filter((c) => store.cardDue(c.id)) : cards;
    session(area, pool, bn);
  }
  draw();
}

export function session(area, pool, bn, onDone) {
  const deck = [...pool].sort(() => Math.random() - 0.5); let i = 0, known = 0;
  const show = () => {
    if (i >= deck.length) { area.replaceChildren(h("div.card.pad.center", h("h2", deck.length ? (bn ? "সব কার্ড শেষ! 🎉" : "Deck complete! 🎉") : bn ? "এখন কোনো কার্ড বাকি নেই।" : "Nothing due right now."), deck.length ? h("p", `${known}/${deck.length} ${bn ? "মনে ছিল" : "remembered"}`) : null)); if (deck.length) confetti(); onDone && onDone(); return; }
    const c = deck[i]; const t = c.topic && topicById(c.topic); let flipped = false;
    const inner = h("div.fc-inner", h("div.fc-face.front", h("small", t ? L(t.title) : c.doc || ""), h("div.fc-text", { html: richInline(c.front) }), h("span.fc-tap", bn ? "ট্যাপ করে উল্টাও" : "tap to flip")), h("div.fc-face.back", h("div.fc-text", { html: richInline(c.back) })));
    const card = h("div.flashcard", { tabindex: 0, onclick: () => { flipped = !flipped; card.classList.toggle("flipped", flipped); grade.classList.toggle("show", true); } }, inner);
    const grade = h("div.fc-grade", h("button.btn.bad", { onclick: () => { store.gradeCard(c.id, false, c.topic); deck.push(c); i++; show(); } }, icon("x"), bn ? " ভুলে গেছি" : " Forgot"), h("button.btn.good", { onclick: () => { store.gradeCard(c.id, true, c.topic); known++; i++; show(); } }, icon("check"), bn ? " মনে ছিল" : " Knew it"));
    area.replaceChildren(h("div.fc-wrap", h("div.fc-progress", h("i", { style: { width: `${(100 * i) / deck.length}%` } })), h("small.muted", `${i + 1} / ${deck.length}`), card, grade));
  };
  show();
}

function sheet(area, bn) {
  let activeSet = "all", query = "";
  const paper = h("div.hand-sheet");
  const search = h("input.inp", { type: "search", placeholder: "Try modulus, limit...", oninput: (e) => { query = e.target.value.trim().toLowerCase(); draw(); } });
  const filters = h("div.sheet-filters");
  const controls = h("div.sheet-tools", h("label.sheet-search", h("span", "Find a formula"), search), filters);
  const draw = () => {
    const sections = SETS.filter((s) => activeSet === "all" || s.id === activeSet).map((s) => {
      const topics = TOPICS.filter((t) => t.set === s.id).map((t) => {
        const formulas = t.formulas.filter((f) => (L(t.title) + " " + L(f.name) + " " + f.tex).toLowerCase().includes(query));
        if (!formulas.length) return null;
        const rows = formulas.map((f) => {
          const copy = h("button.sheet-copy", { title: "Copy formula", "aria-label": "Copy formula: " + L(f.name), onclick: async (e) => { try { await navigator.clipboard.writeText(f.tex); e.currentTarget.textContent = "Copied"; setTimeout(() => { e.currentTarget.textContent = "Copy"; }, 1200); } catch { e.currentTarget.textContent = "Clipboard unavailable"; setTimeout(() => { e.currentTarget.textContent = "Copy"; }, 1200); } } }, "Copy");
          return h("div.sheet-f", h("div.sheet-formula-name", h("b", L(f.name)), copy), h("div.sheet-equation", { html: texHTML(f.tex, true) }));
        });
        return h("article.sheet-topic", h("h3", h("span.sheet-mark", "\u270e"), L(t.title)), rows);
      }).filter(Boolean);
      return topics.length ? h("section.sheet-set", h("h2", h("span.sheet-set-code", s.code), L(s.title)), h("div.sheet-grid", topics)) : null;
    }).filter(Boolean);
    paper.replaceChildren(...(sections.length ? sections : [h("p.sheet-empty", "No formulas match. Try another search.")]));
  };
  [["all", "All sets"], ...SETS.map((s) => [s.id, s.code])].forEach(([id, label]) => {
    filters.append(h("button.chip", { class: activeSet === id ? "on" : "", onclick: (e) => { activeSet = id; filters.querySelectorAll(".chip").forEach((b) => b.classList.remove("on")); e.currentTarget.classList.add("on"); draw(); } }, label));
  });
  area.replaceChildren(h("div.sheet-actions", h("p.sheet-note", "Notebook-style quick reference. Copy a formula or print the sheet."), h("button.btn.small", { onclick: () => window.print() }, "Print")), controls, paper);
  draw();
}
