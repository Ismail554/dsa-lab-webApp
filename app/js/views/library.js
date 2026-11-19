// Library: upload new study materials anytime; they are analysed and woven into lessons, map, practice and revision.
import { h, L, T, lang, icon, toast, markdown, richInline, fmtDate } from "../ui.js";
import { docs, store } from "../store.js";
import { ingestFile, syncServerFiles, FUTURE } from "../ingest.js";
import { topicById } from "../content/curriculum.js";
import { labById } from "../labs/index.js";
import { pageHead } from "./common.js";
import { ai } from "../tutor.js";

export async function render(root, [docId]) {
  if (docId) return reader(root, docId);
  const bn = lang() === "bn";
  root.append(pageHead(T("library"), bn ? "লাইব্রেরি ও আপলোড" : "Library & uploads", bn ? "যেকোনো সময় নতুন .md, .pdf, .txt, .tex বা .html নোট দাও। অ্যাপ নিজে থেকে বিশ্লেষণ করে টপিক, প্রশ্ন, সংজ্ঞা আর ফর্মুলা বের করবে এবং নলেজ ম্যাপ, অনুশীলন ও রিভিশনে যুক্ত করবে — কোনো রিবিল্ড লাগবে না।" : "Drop new .md, .pdf, .txt, .tex or .html notes at any time. They are analysed automatically — topics, questions, worked examples, definitions and formulas — and woven into the knowledge map, practice and revision. No rebuild needed."));
  const st = await ai.check();
  const input = h("input", { type: "file", multiple: true, accept: ".md,.markdown,.txt,.tex,.pdf,.html,.htm", hidden: true });
  const progress = h("div.upload-progress");
  const drop = h("label.dropzone.card", { for: "fileIn" }, icon("upload"), h("b", bn ? "ফাইল এখানে টেনে আনো বা ক্লিক করো" : "Drag files here or click to choose"), h("small", ".md · .pdf · .txt · .tex · .html"), input);
  input.id = "fileIn";
  const handle = async (files) => {
    for (const f of files) {
      const row = h("div.up-row", h("span", f.name), h("span.muted", bn ? "বিশ্লেষণ চলছে…" : "analysing…")); progress.append(row);
      try {
        // keep a copy in materials/ on disk so it survives browser resets and is visible to the server
        fetch(`/api/upload?name=${encodeURIComponent(f.name)}`, { method: "POST", body: f }).catch(() => {});
        const doc = await ingestFile(f, { source: "upload", fingerprint: `materials:${f.name}:${f.size}:${Math.round(f.lastModified)}` });
        row.lastChild.textContent = summary(doc.analysis, bn); row.classList.add("ok");
        row.append(h("a.btn.small", { href: `#/library/${doc.id}` }, bn ? "খুলো" : "Open"));
      } catch (e) { row.lastChild.textContent = String(e.message || e); row.classList.add("bad"); }
    }
    drawList();
  };
  input.addEventListener("change", () => handle([...input.files]));
  ["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("over"); }));
  ["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("over"); }));
  drop.addEventListener("drop", (e) => handle([...e.dataTransfer.files]));

  const list = h("div.doc-list");
  async function drawList() {
    const all = (await docs.all()).sort((a, b) => b.createdAt - a.createdAt);
    list.replaceChildren(...all.map((d) => h("a.doc-row.card", { href: `#/library/${d.id}` }, icon("file"),
      h("div.grow", h("b", d.name), h("small", `${d.source === "course" ? (bn ? "কোর্স শিট" : "course sheet") : d.source === "materials" ? "materials/" : bn ? "আপলোড" : "upload"} · ${fmtDate(d.createdAt)} · ${summary(d.analysis, bn)}`)),
      d.analysis.isCore ? h("span.pill.green", bn ? "মূল কারিকুলামে যুক্ত" : "in core curriculum") : d.analysis.future[0] ? h("span.pill.violet", `+ ${d.analysis.future[0].title}`) : h("span.pill", bn ? "নতুন টপিক" : "new topic"))));
    if (!all.length) list.append(h("p.muted", bn ? "এখনো কিছু নেই।" : "Nothing yet."));
  }
  root.append(h("div.lib-grid", h("div", drop, progress),
    h("section.card.pad.lib-help", h("h3", icon("bulb"), bn ? " দুইভাবে যোগ করা যায়" : " Two ways to add material"),
      h("ol", h("li", bn ? "উপরের বক্সে আপলোড করো (ব্রাউজারে সংরক্ষিত + materials/ ফোল্ডারে কপি)।" : "Upload above (stored in the browser and copied into materials/)."),
        h("li", { html: bn ? `অথবা ফাইল সরাসরি <code>${st.materialsDir || "materials/"}</code> ফোল্ডারে রাখো — অ্যাপ নিজে থেকে ধরবে।` : `Or drop files straight into <code>${st.materialsDir || "materials/"}</code> — the app picks them up automatically.` })),
      h("button.btn.small", { onclick: async () => { const n = await syncServerFiles(); toast(n.length ? `${n.length} new file(s) integrated` : "Up to date", "good"); drawList(); } }, icon("repeat"), bn ? " এখনই স্ক্যান করো" : " Scan folder now"),
      h("p.muted.small", st.ai ? (bn ? "AI সক্রিয়: ডকুমেন্টে “AI দিয়ে উন্নত করো” চাপলে বাংলা সারাংশ ও প্রশ্ন-উত্তর তৈরি হবে।" : "AI is on: open a document and press “Enhance with AI” for bilingual summaries and generated Q&A.") : (bn ? "অফলাইন বিশ্লেষণ চলছে। AI এর জন্য সার্ভারে ANTHROPIC_API_KEY দাও।" : "Offline analysis active. Set ANTHROPIC_API_KEY on the local server to unlock AI enhancement.")))),
    h("h3", bn ? "সব উপকরণ" : "All materials"), list);
  drawList();
}

const summary = (a, bn) => bn ? `${a.sections.length} সেকশন · ${a.questions.length} প্রশ্ন · ${a.examples.length} উদাহরণ · ${a.defs.length} সংজ্ঞা` : `${a.sections.length} sections · ${a.questions.length} questions · ${a.examples.length} worked examples · ${a.defs.length} definitions`;

async function reader(root, id) {
  const bn = lang() === "bn"; const d = (await docs.all()).find((x) => x.id === id);
  if (!d) { location.hash = "#/library"; return; }
  const a = d.analysis; const fut = a.future[0];
  const body = h("div.doc-body");
  let tab = "analysis";
  const tabs = h("div.seg", [["analysis", bn ? "বিশ্লেষণ" : "Analysis"], ["read", bn ? "পড়ো" : "Read"]].map(([v, l]) => h("button", { class: tab === v ? "on" : "", onclick: (e) => { tab = v; tabs.querySelectorAll("button").forEach((b) => b.classList.remove("on")); e.currentTarget.classList.add("on"); draw(); } }, l)));
  root.append(h("div.lab-page-head", h("a.btn.small", { href: "#/library" }, icon("left"), T("library")), h("div", h("h1", d.name), h("p.sub", `${a.words} words · ~${a.minutes} min read · ${summary(a, bn)}`)),
    h("div.row", tabs, h("button.btn.small.ghost", { onclick: async () => { if (confirm(bn ? "মুছে ফেলবে?" : "Remove this document from the library?")) { await docs.remove(d.id); location.hash = "#/library"; } } }, icon("trash")))), body);

  function draw() {
    if (tab === "read") { body.replaceChildren(h("article.card.pad.prose", { html: markdown(d.text) })); return; }
    const linked = a.match.map((m) => topicById(m.id)).filter(Boolean);
    body.replaceChildren(...[
      h("div.two-col",
        h("section.card.pad", h("h3", bn ? "কোথায় যুক্ত হলো" : "Where it plugs in"),
          a.isCore ? h("p", bn ? "এটা মূল কোর্স শিট — এর সব বিষয় ইতিমধ্যে হাতে-বানানো লেসন, ল্যাব ও প্রশ্ন ব্যাংকে আছে।" : "This is one of the core course sheets — its content is already built into hand-crafted lessons, labs and the question bank.") : null,
          fut ? h("div.future", h("b", `🆕 ${bn ? "নতুন টপিক নোড" : "New topic node"}: ${fut.title}`), fut.lab ? h("a.btn.small.primary", { href: `#/labs/${fut.lab}` }, icon("flask"), ` ${L(labById(fut.lab).title)}`) : h("small.muted", bn ? " (এই টপিকের জন্য এখনো ল্যাব নেই — প্রশ্ন ও কার্ড যুক্ত হয়েছে)" : " (no lab for this topic yet — questions and cards were added)")) : null,
          linked.length ? h("div", h("small.muted", bn ? "সম্পর্কিত বিদ্যমান টপিক:" : "Related existing topics:"), h("div.chip-row", linked.map((t) => h("a.chip", { href: `#/learn/${t.id}` }, L(t.title))))) : null,
          h("div.row", a.questions.length ? h("a.btn.primary.small", { href: `#/practice/doc/${d.id}` }, `${bn ? "প্রশ্ন অনুশীলন" : "Practise questions"} (${a.questions.length})`) : null, a.defs.length ? h("a.btn.small", { href: "#/formulas" }, `${bn ? "সংজ্ঞা কার্ড" : "Definition cards"} (${a.defs.length})`) : null),
          ai.status && ai.status.ai ? aiBox(d, bn) : null),
        h("section.card.pad", h("h3", bn ? "সেকশন" : "Sections"), h("ol.sec-list", a.sections.slice(0, 30).map((s) => h("li", h("b", s.title), h("small", ` · ${s.text.split(/\s+/).length} words`)))))),
      a.ai ? h("section.card.pad.prose", h("h3", "✨ AI"), h("div", { html: markdown(a.ai) })) : null,
      a.examples.length ? h("section.card.pad", h("h3", `${bn ? "সমাধানকৃত উদাহরণ" : "Worked examples"} (${a.examples.length})`), ...a.examples.slice(0, 12).map((e) => h("details.example", h("summary", e.q.slice(0, 160)), h("pre", e.a)))) : null,
      a.formulas.length ? h("section.card.pad", h("h3", bn ? "শনাক্তকৃত সূত্র" : "Detected formulas"), h("div.formula-chips", a.formulas.slice(0, 40).map((f) => h("code", f)))) : null,
      a.defs.length ? h("section.card.pad", h("h3", bn ? "সংজ্ঞা" : "Definitions"), h("ul", a.defs.slice(0, 20).map((s) => h("li", s)))) : null,
    ].filter(Boolean));
  }
  draw();
}

function aiBox(d, bn) {
  return h("button.btn.small", { onclick: async (e) => {
    const btn = e.currentTarget; btn.disabled = true; btn.textContent = bn ? "AI কাজ করছে…" : "Claude is reading…";
    try {
      const text = d.text.slice(0, 60000);
      const out = await ai.ask([{ role: "user", content: `Here are new CSE 2205 (Data Structures & Algorithms II) study notes (file: ${d.name}).\n"""\n${text}\n"""\nProduce, in Markdown with LaTeX:\n## Summary (English)\n5 bullets.\n## সারাংশ (বাংলা)\n5 bullets in Bangla (English math terms allowed).\n## Key formulas\n## Socratic questions\n5 questions that make a student think, no answers.\n## Exam questions with answers\n6 exam-style questions, each followed by a concise worked answer.` }], "", { effort: "medium", max_tokens: 6000 });
      d.analysis.ai = out; await docs.put(d); location.reload();
    } catch (err) { toast(err.message, "bad", 5000); btn.disabled = false; btn.textContent = "Retry"; }
  } }, icon("spark"), bn ? " AI দিয়ে উন্নত করো" : " Enhance with AI");
}
