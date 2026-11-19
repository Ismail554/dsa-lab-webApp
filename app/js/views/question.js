// Reusable question renderer: auto-checked answers, guided solutions, theory rubrics, self-assessment.
import { h, L, lang, icon, rich, richInline, confetti, texHTML } from "../ui.js";
import { store } from "../store.js";
import { topicById } from "../content/curriculum.js";
import { checkFields, rubric } from "../checker.js";
import { answerInput } from "./learn.js";
import { openTutor, ai } from "../tutor.js";

/**
 * q: bank item or generated item ({q, fields, solution, topic}) or doc question ({q, answer?, topic?})
 * opts: { mode: "practice" | "exam", onResult(ok, frac), compact }
 */
export function questionCard(q, opts = {}) {
  const bn = lang() === "bn"; const exam = opts.mode === "exam";
  const t = q.topic && topicById(q.topic);
  const card = h("article.qcard.card");
  const head = h("div.q-head", q.src ? h("span.pill.violet", q.src) : null, t ? h("a.pill.small", { href: `#/learn/${t.id}` }, L(t.title)) : null, q.marks ? h("span.pill.gold", `${q.marks} ${bn ? "নম্বর" : "marks"}`) : null,
    q.type === "theory" ? h("span.pill", bn ? "সংজ্ঞা/প্রমাণ" : "definition / proof") : null);
  const stmt = rich(q.q, "div", "q-stmt");
  const fb = h("div.feedback");
  const extra = h("div.q-extra");
  card.append(head, stmt);
  let recorded = false, finished = false; const state = { value: null, result: null };
  // First graded attempt counts toward mastery; the question "finishes" when solved or revealed.
  const record = (ok) => { if (recorded) return; recorded = true; if (q.topic) store.record(q.topic, ok, { qid: q.id, kind: exam ? "exam" : "practice" }); };
  const done = (ok, frac = ok ? 1 : 0) => { record(ok); if (finished) return; finished = true; state.result = { ok, frac }; if (ok && q.id) store.set({ solved: { ...(store.state.solved || {}), [q.id]: Date.now() } }); opts.onResult && opts.onResult(ok, frac); };

  if (q.type === "auto" || (q.fields && q.fields.length)) {
    const inputs = q.fields.map((f) => answerInput(f));
    let guided = 0; const steps = q.solution || [];
    const stepsBox = h("ol.guided");
    const showStep = () => { if (guided < steps.length) { stepsBox.append(h("li", { html: richInline(steps[guided++]) })); if (guided >= steps.length) guideBtn.disabled = true; } };
    const guideBtn = h("button.btn.small", { onclick: showStep }, icon("bulb"), bn ? " গাইডেড সমাধান: পরের ধাপ" : " Guided solution: next step");
    const check = () => {
      const r = checkFields(q.fields, inputs.map((i) => i.input.value)); inputs.forEach((i, k) => i.mark(r.res[k].ok));
      state.value = inputs.map((i) => i.input.value);
      if (exam) { state.result = { ok: r.ok, frac: r.res.filter((x) => x.ok).length / r.res.length }; opts.onChange && opts.onChange(state); return; }
      if (r.ok) { fb.className = "feedback good"; fb.innerHTML = `✓ <b>${bn ? "সঠিক!" : "Correct!"}</b>${guided ? ` <small>(${guided} ${bn ? "টা হিন্ট নিয়েছ" : "hint step(s) used"})</small>` : ""}`; confetti(card); while (guided < steps.length) showStep(); done(guided < Math.ceil(steps.length / 2), 1); }
      else { fb.className = "feedback bad"; fb.innerHTML = `${bn ? "পুরোপুরি ঠিক হয়নি।" : "Not quite."} ${r.res.find((x) => x.msg)?.msg || ""} ${bn ? "একটা গাইডেড ধাপ দেখো, অথবা আবার চেষ্টা করো।" : "Reveal a guided step or try again."}`; record(false); }
    };
    inputs.forEach((i) => i.input.addEventListener(exam ? "input" : "keydown", (e) => { if (exam) check(); else if (e.key === "Enter") check(); }));
    card.append(h("div.fields", inputs.map((i) => i.el)));
    if (!exam) card.append(h("div.row.q-actions", h("button.btn.primary", { onclick: check }, icon("check"), bn ? " চেক করো" : " Check"), steps.length ? guideBtn : null,
      h("button.btn.small.ghost", { onclick: () => { while (guided < steps.length) showStep(); inputs.forEach((i, k) => { i.input.value = (q.fields[k].show || q.fields[k].ans); }); done(false); } }, bn ? "সমাধান দেখাও" : "Show solution"),
      labBtn(q, t), h("button.btn.small.ghost", { onclick: () => openTutor(bn ? `এই প্রশ্নে হিন্ট দাও: ${q.q}` : `Give me a Socratic hint (not the answer) for: ${q.q}`) }, icon("chat"), " Jarvis")), fb, stepsBox);
    state.check = check;
  } else {
    // theory / proof / uploaded question
    const ta = h("textarea.theory-input", { rows: exam ? 6 : 5, placeholder: bn ? "তোমার উত্তর লিখো (সংজ্ঞা, প্রমাণের ধাপ)…" : "Write your answer (definition, proof steps)…" });
    ta.addEventListener("input", () => { state.value = ta.value; if (exam && q.points) { const r = rubric(ta.value, q.points); state.result = { ok: r.score >= 0.6, frac: r.score }; } opts.onChange && opts.onChange(state); });
    card.append(ta);
    if (!exam) {
      const evalBtn = h("button.btn.primary", { onclick: () => {
        const r = q.points ? rubric(ta.value, q.points) : null;
        const model = q.answer ? h("div.model", h("b", bn ? "মডেল উত্তর" : "Model answer"), rich(q.answer)) : h("div.model", h("i", bn ? "এই প্রশ্নের জন্য সংরক্ষিত উত্তর নেই — নিজের নোটের সাথে মিলিয়ে নাও।" : "No stored answer for this question — compare with your notes or ask Jarvis."));
        const pts = r ? h("ul.concepts", q.points.map((g, k) => h("li", { class: r.hit[k] ? "ok" : "miss" }, r.hit[k] ? "✓ " : "○ ", g[0]))) : null;
        const self = h("div.self", h("span", bn ? "নিজেকে মূল্যায়ন করো:" : "Mark yourself:"),
          ...[[1, bn ? "পুরো ঠিক" : "Got it"], [0.5, bn ? "আংশিক" : "Partly"], [0, bn ? "পারিনি" : "Missed"]].map(([v, l]) => h("button.btn.small", { onclick: (e) => { e.currentTarget.parentElement.querySelectorAll("button").forEach((b) => (b.disabled = true)); done(v >= 0.75, v); } }, l)));
        extra.replaceChildren(r ? h("div.rubric", h("b", `${bn ? "মূল পয়েন্ট কভার" : "Key points covered"}: ${Math.round(r.score * 100)}%`), pts) : null, model, self,
          ai.status && ai.status.ai && ta.value.trim() ? h("button.btn.small", { onclick: async (e) => { e.currentTarget.disabled = true; const o = h("div.ai-out", "…"); extra.append(o); try { o.innerHTML = richInline(await ai.ask([{ role: "user", content: `Exam question: ${q.q}\nModel answer: ${q.answer || "(none)"}\nStudent answer: """${ta.value}"""\nMark it out of ${q.marks || 5} like a strict but kind university examiner. List what earned marks, what lost marks, and one fix.` }], `Reply language: ${lang()}.`, { effort: "medium" })); } catch (err) { o.textContent = err.message; } } }, icon("spark"), bn ? " AI পরীক্ষক" : " AI examiner") : null);
      } }, icon("check"), bn ? " মূল্যায়ন ও মডেল উত্তর" : " Evaluate & show model answer");
      card.append(h("div.row.q-actions", evalBtn, labBtn(q, t), h("button.btn.small.ghost", { onclick: () => openTutor(bn ? `এই প্রশ্নটা ধাপে ধাপে ভাবতে সাহায্য করো: ${q.q}` : `Help me think through (Socratic, no full answer yet): ${q.q}`) }, icon("chat"), " Jarvis")), extra);
    }
  }
  card.state = state;
  return card;
}

function labBtn(q, t) {
  const spec = q.lab || (t && t.steps.find((s) => s.lab)?.lab);
  if (!spec) return null;
  return h("a.btn.small.ghost", { href: `#/labs/${spec.id}` }, icon("flask"), lang() === "bn" ? " ল্যাবে দেখো" : " See it in the lab");
}
