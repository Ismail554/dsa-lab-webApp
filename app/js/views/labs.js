import { h, L, T, lang, icon } from "../ui.js";
import { store } from "../store.js";
import { LABS, labById } from "../labs/index.js";
import { topicById } from "../content/curriculum.js";
import { pageHead } from "./common.js";
import { setTutorTopic, openTutor } from "../tutor.js";

export function render(root, [id]) {
  const bn = lang() === "bn";
  if (!id) {
    root.append(pageHead(T("labs"), bn ? "গণিত ল্যাবরেটরি" : "The mathematics laboratory", bn ? "প্রতিটা ল্যাব একটা খেলার মাঠ: টানো, স্লাইড করো, অ্যানিমেট করো। লেসনগুলো এগুলোকেই নির্দিষ্ট সেটিং এ ব্যবহার করে।" : "Each lab is a playground: drag, slide, animate. Lessons use these same labs with specific set-ups."));
    root.append(h("div.lab-gallery", LABS.map((lb) => h("a.lab-card.card", { href: `#/labs/${lb.id}` },
      h("div.lc-top", h("span.lc-ico", { html: "" }, icon(lb.icon)), lb.preview ? h("span.pill.gold", bn ? "প্রিভিউ" : "preview") : null, store.state.labsUsed[lb.id] ? h("span.pill", `${store.state.labsUsed[lb.id]}×`) : null),
      h("h3", L(lb.title)), h("p", L(lb.blurb)),
      h("div.lc-topics", lb.topics.map((t) => topicById(t)).filter(Boolean).map((t) => h("span.pill.small", L(t.title))))))));
    return;
  }
  const lb = labById(id); if (!lb) { location.hash = "#/labs"; return; }
  store.useLab(id); setTutorTopic(lb.topics[0]);
  const host = h("div.full-lab.card");
  root.append(h("div.lab-page-head", h("a.btn.small", { href: "#/labs" }, icon("left"), T("labs")), h("div", h("h1", L(lb.title)), h("p.sub", L(lb.blurb))),
    h("div.lab-topics", lb.topics.map((t) => topicById(t)).filter(Boolean).map((t) => h("a.pill.violet", { href: `#/learn/${t.id}` }, "📘 ", L(t.title))),
      h("button.btn.small", { onclick: () => openTutor(bn ? `${L(lb.title)} নিয়ে প্রশ্ন করো` : `quiz me`) }, icon("chat"), " Jarvis"))), host);
  const ctl = lb.mount(host, {});
  return { destroy() { ctl.destroy(); } };
}
