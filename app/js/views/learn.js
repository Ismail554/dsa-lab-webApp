// Lessons: step-by-step visual teaching with Socratic checkpoints and a Feynman "explain it back" finale.
import { h, L, T, lang, icon, rich, richInline, toast, confetti, texHTML } from "../ui.js";
import { store } from "../store.js";
import { TOPICS, SETS, topicById, topicsOfSet } from "../content/curriculum.js";
import { labById } from "../labs/index.js";
import { checkFields, feynmanScore, previewOf, placeholderOf, showAns } from "../checker.js";
import { ring, topicCard, pageHead, tagPill } from "./common.js";
import { setTutorTopic, openTutor, ai } from "../tutor.js";
import { BANK } from "../content/bank.js";

export function render(root, [topicId]) {
  if (!topicId) return list(root);
  const t = topicById(topicId); if (!t) { location.hash = "#/learn"; return; }
  return lesson(root, t);
}

function list(root) {
  const bn = lang() === "bn";
  root.append(pageHead(T("learn"), bn ? "সব লেসন" : "All lessons", bn ? "কোর্স শিট থেকে বানানো ধাপে ধাপে ভিজ্যুয়াল লেসন। যেকোনো ক্রমে শেখা যায়, তবে নলেজ ম্যাপের ক্রম অনুসরণ করা সবচেয়ে ভালো।" : "Step-by-step visual lessons built from your course sheets. Any order works, but following the knowledge-map order is smoothest."));
  for (const s of SETS) root.append(h("section.set-block", h("div.set-head", h("span.pill.violet", s.code), h("h2", L(s.title))), h("div.topic-grid", topicsOfSet(s.id).map((t) => topicCard(t)))));
}

function lesson(root, t) {
  const bn = lang() === "bn";
  setTutorTopic(t.id);
  const set = SETS.find((s) => s.id === t.set); const idxInSet = topicsOfSet(t.set).indexOf(t) + 1;
  const steps = [...t.steps, { tag: "feynman", feynman: true, title: { en: "Explain it back", bn: "নিজের ভাষায় বোঝাও" } }];
  const saved = store.state.lessons[t.id];
  let cur = Math.min(saved && !saved.done ? saved.step || 0 : 0, steps.length - 1);
  const passed = new Set(Array.from({ length: saved ? (saved.done ? steps.length : saved.step || 0) : 0 }, (_, k) => k));
  let lab = null, labId = null;

  const stage = h("div.stage.card");
  const stepper = h("div.stepper");
  const panel = h("div.step-card.card");
  const learnList = h("ul.learn-list");
  const head = h("div.lesson-head",
    h("div.crumb", `${set.code} · ${L(set.title)}`, h("span.sep", "/"), bn ? `লেসন ${idxInSet}/${topicsOfSet(t.set).length}` : `Lesson ${idxInSet} of ${topicsOfSet(t.set).length}`),
    h("div.title-row", h("h1", L(t.title)), h("div.pills", h("span.pill.gold", icon("clock"), `${t.minutes} min`), h("span.pill.green", t.level), h("span.pill.violet", `${steps.length} ${bn ? "ধাপ" : "steps"}`))),
    h("p.sub", L(t.summary)));

  root.append(h("div.lesson",
    h("div.lesson-main", head, stage, h("div.card.stepper-card", h("div.stepper-head", h("b", T("inLesson")), h("span#stepCount")), stepper)),
    h("div.lesson-side", panel, h("div.card.pad.learn-card", h("h4", T("youlearn")), learnList),
      h("div.card.pad.related", h("h4", bn ? "এই টপিকের পরীক্ষার প্রশ্ন" : "Exam questions on this topic"),
        h("div.related-list", BANK.filter((q) => q.topic === t.id).slice(0, 6).map((q) => h("a.rel-q", { href: `#/practice/q/${q.id}`, html: `<small>${q.src}</small> ${richInline(q.q.length > 90 ? q.q.slice(0, 90) + "…" : q.q)}` }))),
        h("a.btn.small", { href: `#/practice/topic/${t.id}` }, bn ? "সব অনুশীলন →" : "Practise this topic →")))));

  function mountLab(spec) {
    if (!spec) return;
    if (lab && labId === spec.id) { lab.set(spec.preset || {}); return; }
    if (lab) lab.destroy(); stage.replaceChildren();
    const box = h("div.stage-lab"); stage.append(box, h("div.stage-foot", h("span.legend", icon("target"), bn ? " ▶ চালাও বা ধাপে ধাপে এগোও · নিজের ইনপুট দিয়ে চেষ্টা করো" : " press ▶ or step through · try your own input"), h("a.btn.small", { href: `#/labs/${spec.id}` }, bn ? "পূর্ণ ল্যাব খুলো ↗" : "Open full lab ↗")));
    lab = labById(spec.id).mount(box, { ...(spec.preset || {}), compact: true }); labId = spec.id; store.useLab(spec.id);
  }

  function renderStepper() {
    stepper.replaceChildren(...steps.map((s, k) => h("button.dot-step", { class: [k === cur ? "on" : "", passed.has(k) ? "done" : ""].join(" "), onclick: () => (k <= Math.max(...passed, 0) + 1 || passed.has(k - 1) || k === 0 ? go(k) : toast(bn ? "আগের ধাপের প্রশ্নটা আগে শেষ করো" : "Finish the checkpoint first")), title: L(s.title) }, h("span", String(k + 1)), h("small", L(s.title)))));
    root.querySelector("#stepCount").textContent = `${T("step")} ${cur + 1} ${T("of")} ${steps.length}`;
    learnList.replaceChildren(...t.learn.map((l, k) => h("li", { class: passed.size >= Math.ceil(((k + 1) * t.steps.length) / t.learn.length) ? "ok" : "" }, h("span.cb", icon("check")), L(l))));
  }

  function go(k) {
    cur = Math.max(0, Math.min(steps.length - 1, k)); const s = steps[cur];
    if (s.lab) mountLab(s.lab); else if (s.feynman && !lab) mountLab(t.steps[t.steps.length - 1].lab);
    panel.replaceChildren(...(s.feynman ? feynmanPanel() : stepPanel(s)));
    store.lessonProgress(t.id, Math.max(...passed, -1) + 1, steps.length);
    renderStepper(); panel.classList.remove("flip"); void panel.offsetWidth; panel.classList.add("flip");
  }

  function nav(canNext) {
    const back = h("button.btn", { disabled: cur === 0, onclick: () => go(cur - 1) }, icon("left"), T("back"));
    const nxt = h("button.btn.primary.next", { disabled: !canNext, onclick: () => go(cur + 1) }, h("span", `${T("next")}: ${L(steps[cur + 1] ? steps[cur + 1].title : "")}`), icon("arrow"));
    return { el: h("div.step-nav", back, cur < steps.length - 1 ? nxt : null), nxt };
  }

  function stepPanel(s) {
    const n = nav(passed.has(cur) || !s.ask);
    const out = [
      h("div.step-top", h("span.step-k", `${T("step").toUpperCase()} ${cur + 1} / ${steps.length}`), tagPill(s.tag || "idea")),
      h("h2.step-title", L(s.title)), rich(s.body, "div", "step-body"),
      s.key ? h("div.key-idea", h("div.ki-head", icon("spark"), T("keyIdea")), rich(s.key)) : null,
    ];
    if (s.ask) out.push(askBlock(s.ask, () => { passed.add(cur); n.nxt.disabled = false; n.nxt.classList.add("pulse"); renderStepper(); store.record(t.id, true, { kind: "lesson", weight: 0.5 }); }, () => store.record(t.id, false, { kind: "lesson", weight: 0.3 }), s.story));
    else passed.add(cur);
    out.push(n.el, h("div.kbd-hint", h("kbd", "←"), h("kbd", "→"), bn ? " ধাপ বদলাও" : " step", " · ", h("button.linkish", { onclick: () => openTutor(bn ? `${L(s.title)} বুঝিয়ে দাও` : `explain ${L(t.title)}`) }, icon("chat"), bn ? " Jarvis-কে জিজ্ঞেস করো" : " ask Jarvis about this")));
    return out;
  }

  function askBlock(ask, onPass, onFail, storyMode = false) {
    const fb = h("div.feedback"); let tries = 0;
    const box = h(`div.ask${storyMode ? " story-choice" : ""}`, h("div.ask-head", icon(storyMode ? "spark" : "bulb"), storyMode ? (bn ? "গল্পে তোমার সিদ্ধান্ত" : "You choose what happens next") : (bn ? "চেকপয়েন্ট — আগে অনুমান করো" : "Checkpoint — predict before you move on")), rich(ask.q, "div", "ask-q"));
    const pass = () => { box.classList.add("passed"); fb.className = "feedback good"; fb.innerHTML = `${storyMode ? `<b>${bn ? "তোমার সিদ্ধান্তের ফল" : "Your choice changes the scene"}:</b> ` : `✓ <b>${T("correct")}</b> `}${richInline(L(ask.why) || "")}`; onPass(); confetti(box); };
    const fail = (msg) => { tries++; onFail(); fb.className = "feedback bad"; fb.innerHTML = `${T("wrong")} ${msg ? richInline(msg) : ""} ${tries >= 1 && ask.hint ? `<div class="hint">💡 ${richInline(L(ask.hint))}</div>` : ""} ${tries >= 2 ? `<button class="linkish reveal">${bn ? "উত্তর দেখে এগিয়ে যাও" : "Reveal answer & continue"}</button>` : ""}`;
      const r = fb.querySelector(".reveal"); if (r) r.onclick = () => { fb.className = "feedback info"; fb.innerHTML = `${bn ? "উত্তর" : "Answer"}: ${ask.type === "mcq" ? richInline(L(ask.options[ask.answer])) : ask.fields.map((f) => `${f.label} = <code>${showAns(f)}</code>`).join(", ")} — ${richInline(L(ask.why) || "")}`; passed.add(cur); renderStepper(); panel.querySelector(".next") && (panel.querySelector(".next").disabled = false); };
    };
    if (ask.type === "mcq") {
      box.append(h("div.options", ask.options.map((o, k) => h("button.opt", { onclick: (e) => { if (box.classList.contains("passed")) return; if (k === ask.answer) { e.currentTarget.classList.add("right"); pass(); } else { e.currentTarget.classList.add("wrong"); fail(); } }, html: `<span class="opt-k">${"ABCD"[k]}</span>${richInline(L(o))}` }))));
    } else {
      const inputs = ask.fields.map((f) => answerInput(f));
      const check = () => { const r = checkFields(ask.fields, inputs.map((i) => i.input.value)); inputs.forEach((i, k) => i.mark(r.res[k].ok)); if (r.ok) pass(); else fail(r.res.find((x) => x.msg)?.msg); };
      inputs.forEach((i) => i.input.addEventListener("keydown", (e) => { if (e.key === "Enter") check(); }));
      box.append(h("div.fields", inputs.map((i) => i.el)), h("button.btn.primary.small", { onclick: check }, icon("check"), T("check")));
    }
    box.append(fb); return box;
  }

  function feynmanPanel() {
    const prev = store.state.feynman[t.id];
    const ta = h("textarea.feynman-input", { rows: 7, placeholder: bn ? "সহজ ভাষায় লিখো, যেন ১২ বছরের কাউকে বোঝাচ্ছ… বাংলা, Banglish বা English — যেকোনোটা।" : "Write it simply, as if teaching a 12-year-old… English, Bangla or Banglish all fine." });
    if (prev) ta.value = prev.text;
    const result = h("div.feynman-result");
    const evaluate = () => {
      const text = ta.value.trim(); if (text.split(/\s+/).length < 8) { toast(bn ? "আরেকটু লিখো (অন্তত ৮ শব্দ)" : "Write a bit more (at least 8 words)"); return; }
      const sc = feynmanScore(text, t.feynman.keywords);
      store.set({ feynman: { ...store.state.feynman, [t.id]: { text, score: sc.score, ts: Date.now() } } });
      store.record(t.id, sc.score >= 60, { kind: "feynman", weight: 0.8 });
      const concepts = t.feynman.keywords.map((g, k) => h("li", { class: sc.coverage.hit[k] ? "ok" : "miss" }, sc.coverage.hit[k] ? "✓ " : "○ ", g[0]));
      const tips = [];
      sc.coverage.hit.forEach((x, k) => { if (!x) tips.push(bn ? `"${t.feynman.keywords[k][0]}" ধারণাটা যোগ করো।` : `Mention the idea of “${t.feynman.keywords[k][0]}”.`); });
      if (!sc.hasExample) tips.push(bn ? "একটা ছোট সংখ্যাসহ উদাহরণ দাও।" : "Add a tiny worked example with numbers.");
      if (!sc.hasAnalogy) tips.push(bn ? "একটা তুলনা বা ছবি ব্যবহার করো (“ধরো…”, “যেমন…”)।" : "Use an analogy or picture (“imagine…”, “it's like…”).");
      if (sc.avgLen > 28) tips.push(bn ? "বাক্য ছোট করো।" : "Shorter sentences — simplicity is the goal.");
      result.replaceChildren(h("div.fr-top", ring(sc.score / 100, 64), h("div", h("b", sc.score >= 80 ? (bn ? "চমৎকার! তুমি এটা পড়াতে পারবে।" : "Excellent — you could teach this.") : sc.score >= 60 ? (bn ? "ভালো! কয়েকটা ফাঁক আছে।" : "Good — a few gaps to close.") : bn ? "আবার চেষ্টা করো — ফাঁকগুলো দেখো।" : "Keep going — see the gaps below."), h("small", `${sc.words} ${bn ? "শব্দ" : "words"}`))),
        h("ul.concepts", concepts), tips.length ? h("div.tips", h("b", bn ? "উন্নতির উপায়:" : "To improve:"), h("ul", tips.map((x) => h("li", x)))) : null,
        h("button.btn.small.revise-explanation", { onclick: () => { ta.focus(); ta.scrollIntoView({ behavior: "smooth", block: "center" }); } }, icon("edit"), bn ? "ফাঁকগুলো পূরণ করে আবার দেখো" : "Revise your explanation and check again"),
        ai.status && ai.status.ai ? h("button.btn.small", { onclick: (e) => aiCritique(text, e.currentTarget) }, icon("spark"), bn ? " Jarvis-এর (AI) মতামত" : " Get Jarvis's AI critique") : null);
      if (sc.score >= 60) { passed.add(cur); store.lessonProgress(t.id, steps.length, steps.length, true); renderStepper(); confetti(result); }
    };
    const aiCritique = async (text, btn) => {
      btn.disabled = true; const out = h("div.ai-out", "…"); result.append(out);
      try { out.innerHTML = richInline(await ai.ask([{ role: "user", content: `Topic: ${t.title.en}. Feynman-technique explanation by a student:\n"""${text}"""\nGive (1) what is correct, (2) one misconception or gap, (3) one Socratic question to push them further. Be brief.` }], `Reply language: ${lang()}.`)); }
      catch (e) { out.textContent = e.message; }
    };
    return [
      h("div.step-top", h("span.step-k", `${T("step").toUpperCase()} ${cur + 1} / ${steps.length}`), tagPill("feynman")),
      h("h2.step-title", T("explainBack")),
      h("div.step-body", h("p", { html: richInline(bn ? "**Feynman পদ্ধতি:** যদি সহজ ভাষায় বোঝাতে না পারো, তাহলে এখনো পুরোপুরি বোঝোনি। নিজের ভাষায় বোঝাও, তারপর score-এর ফাঁকগুলো পূরণ করে আবার চেষ্টা করো:" : "**Feynman technique:** explain the idea simply in your own words, then use the feedback to fill gaps and try again." ) }), h("blockquote", L(t.feynman.prompt)), h("p.feynman-guide", bn ? "ভাবো: এটা কী সমস্যার সমাধান করে? ছোট একটা উদাহরণে কী ঘটে? কোন অবস্থায় এই কৌশলটি কাজ নাও করতে পারে?" : "As you explain, ask yourself: What problem does it solve? What happens in a tiny example? When might this approach fail?")),
      ta, h("div.row", h("button.btn.primary", { onclick: evaluate }, icon("check"), bn ? " মূল্যায়ন করো" : " Evaluate my explanation"), h("a.btn", { href: `#/practice/topic/${t.id}` }, bn ? "পরীক্ষার অনুশীলন →" : "Exam drill →")),
      result, nav(false).el,
    ];
  }

  const onKey = (e) => { if (/input|textarea/i.test(document.activeElement.tagName)) return; if (e.key === "ArrowRight" && (passed.has(cur) || !steps[cur].ask) && cur < steps.length - 1) go(cur + 1); if (e.key === "ArrowLeft") go(cur - 1); };
  window.addEventListener("keydown", onKey);
  go(cur);
  return { destroy() { window.removeEventListener("keydown", onKey); lab && lab.destroy(); } };
}

/** Input with live math preview. */
export function answerInput(f) {
  const input = h("input.inp.ans", { placeholder: placeholderOf(f), autocomplete: "off", spellcheck: "false" });
  const prev = h("span.preview");
  input.addEventListener("input", () => {
    el.classList.remove("ok", "bad"); const p = previewOf(f, input.value);
    prev.innerHTML = !p ? "" : p.tex ? texHTML(p.tex) : p.text.replace(/[<>&]/g, "");
  });
  const el = h("label.field", h("span.field-l", f.label), input, prev);
  return { el, input, mark: (ok) => { el.classList.toggle("ok", ok); el.classList.toggle("bad", !ok); } };
}
