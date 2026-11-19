// Shared view widgets: mastery ring, topic chip, page header, empty state.
import { h, L, texHTML } from "../ui.js";
import { store } from "../store.js";

export function ring(v, size = 38, label = true) {
  const r = (size - 6) / 2, c = 2 * Math.PI * r, p = Math.max(0, Math.min(1, v));
  const col = p >= 0.75 ? "var(--green-3)" : p >= 0.45 ? "var(--gold)" : p > 0 ? "var(--rust)" : "var(--line-strong)";
  return h("span.ring", { style: { width: size + "px", height: size + "px" }, html: `<svg viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--line)" stroke-width="4"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${col}" stroke-width="4" stroke-linecap="round" stroke-dasharray="${c * p} ${c}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg>${label ? `<b>${Math.round(p * 100)}</b>` : ""}` });
}

export function pageHead(kicker, title, sub, ...extra) {
  return h("div.page-head", h("div", h("div.kicker", kicker), h("h1", title), sub ? h("p.sub", sub) : null), ...extra);
}

export function topicCard(t, onClick) {
  const m = store.masteryOf(t.id); const ls = store.state.lessons[t.id];
  return h("a.topic-card", { href: `#/learn/${t.id}`, onclick: onClick },
    h("div.tc-top", ring(m), h("div", h("div.tc-title", L(t.title)), h("div.tc-meta", `${t.minutes} min · ${t.level}${ls && ls.done ? " · ✓" : ""}`))),
    h("p.tc-sum", L(t.summary)));
}

export function empty(msg, action) { return h("div.empty", h("p", L(msg)), action || null); }
export function kbd(k) { return h("kbd", k); }
export const tagPill = (tag) => h(`span.tag.tag-${tag}`, tag);
export function mathEl(src, display = false) { return h(display ? "div.mathblock" : "span", { html: texHTML(src, display) }); }
