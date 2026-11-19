// Ctrl+K command palette across topics, labs, questions, formulas and uploaded documents.
import { h, L, T, richInline, icon } from "../ui.js";
import { TOPICS } from "../content/curriculum.js";
import { LABS } from "../labs/index.js";
import { BANK } from "../content/bank.js";
import { docs } from "../store.js";

let open = false;
export async function openSearch() {
  if (open) return; open = true;
  const items = [
    ...TOPICS.map((t) => ({ kind: "Lesson", text: `${L(t.title)} ${t.title.en} ${t.summary.en} ${t.title.bn}`, title: L(t.title), sub: L(t.summary), href: `#/learn/${t.id}` })),
    ...LABS.map((l) => ({ kind: "Lab", text: `${l.title.en} ${l.title.bn} ${l.blurb.en}`, title: L(l.title), sub: L(l.blurb), href: `#/labs/${l.id}` })),
    ...BANK.map((q) => ({ kind: q.src, text: `${q.src} ${q.q}`, title: q.q, sub: "", href: `#/practice/q/${q.id}`, math: true })),
    ...TOPICS.flatMap((t) => t.formulas.map((f) => ({ kind: "Formula", text: `${f.name.en} ${f.name.bn} ${f.tex}`, title: `$${f.tex}$`, sub: L(f.name), href: `#/formulas/${t.id}`, math: true }))),
    ...(await docs.all()).map((d) => ({ kind: "Library", text: `${d.name} ${d.text.slice(0, 4000)}`, title: d.name, sub: `${d.analysis.words} words`, href: `#/library/${d.id}` })),
  ];
  const inp = h("input.palette-input", { placeholder: T("search"), autofocus: true });
  const list = h("div.palette-list"); let sel = 0, shown = [];
  const close = () => { wrap.remove(); open = false; };
  const draw = () => {
    const q = inp.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    shown = (q.length ? items.filter((it) => q.every((w) => it.text.toLowerCase().includes(w))) : items.slice(0, 16)).slice(0, 40);
    sel = Math.min(sel, shown.length - 1);
    list.replaceChildren(...shown.map((it, k) => h("a.pal-item", { href: it.href, class: k === sel ? "on" : "", onclick: close },
      h("span.pal-kind", it.kind), h("span.pal-title", { html: richInline(it.title.length > 120 ? it.title.slice(0, 120) + "…" : it.title) }), it.sub ? h("small", it.sub.slice(0, 90)) : null)));
    if (!shown.length) list.append(h("div.pal-empty", "No matches"));
  };
  inp.addEventListener("input", () => { sel = 0; draw(); });
  inp.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { sel = Math.min(shown.length - 1, sel + 1); draw(); e.preventDefault(); }
    if (e.key === "ArrowUp") { sel = Math.max(0, sel - 1); draw(); e.preventDefault(); }
    if (e.key === "Enter" && shown[sel]) { location.hash = shown[sel].href; close(); }
    if (e.key === "Escape") close();
  });
  const wrap = h("div.palette-wrap", { onclick: (e) => { if (e.target === wrap) close(); } }, h("div.palette.card", h("div.pal-head", icon("search"), inp, h("kbd", "Esc")), list));
  document.body.append(wrap); draw(); inp.focus();
}
