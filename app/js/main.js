// App shell + hash router.
import { h, clear, T, L, icon, lang, toast } from "./ui.js";
import { store } from "./store.js";
import { openTutor } from "./tutor.js";
import { openSearch } from "./views/search.js";
import { syncServerFiles } from "./ingest.js";

const ROUTES = {
  "": () => import("./views/home.js"), learn: () => import("./views/learn.js"), labs: () => import("./views/labs.js"),
  practice: () => import("./views/practice.js"), exam: () => import("./views/exam.js"), revise: () => import("./views/revise.js"),
  progress: () => import("./views/progress.js"), formulas: () => import("./views/formulas.js"), library: () => import("./views/library.js"),
};
const NAV = [
  ["", "home", "home"], ["learn", "learn", "book"], ["labs", "labs", "flask"], ["practice", "practice", "pen"], ["exam", "exam", "clock"],
  ["revise", "revise", "repeat"], ["formulas", "formulas", "cards"], ["progress", "progress", "map"], ["library", "library", "upload"],
];

let current = null; // { destroy }
const main = h("main#view", { tabindex: "-1" });
const side = h("nav#side");

function applyTheme() {
  const t = store.state.theme; const root = document.documentElement;
  if (t) root.dataset.theme = t; else delete root.dataset.theme;
  root.lang = lang() === "bn" ? "bn" : "en";
}

function header() {
  const dark = () => (store.state.theme ? store.state.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches);
  const themeBtn = h("button.icon-btn", { title: "Theme", onclick: () => { store.set({ theme: dark() ? "light" : "dark" }); applyTheme(); themeBtn.replaceChildren(icon(dark() ? "sun" : "moon")); } }, icon(dark() ? "sun" : "moon"));
  const langBtn = h("button.lang-btn", { title: "Language / ভাষা", onclick: () => { store.set({ lang: lang() === "bn" ? "en" : "bn", langSet: true }); location.reload(); } }, icon("globe"), h("span", lang() === "bn" ? "বাংলা" : "EN"));
  return h("header#top",
    h("button.icon-btn.menu-btn", { title: "Menu", onclick: () => document.body.classList.toggle("side-open") }, icon("menu")),
    h("a.brand", { href: "#/" }, h("span.logo", { html: LOGO }), h("span.brand-name", "DSA", h("mark", "Lab")), h("span.brand-sub", "CSE 2205")),
    h("button.search", { onclick: openSearch }, icon("search"), h("span", T("search")), h("kbd", "Ctrl K")),
    h("div.top-actions", h("span.streak", { title: "Study streak" }, icon("flame"), h("b#streakN", String(store.streak()))), langBtn, themeBtn,
      h("button.btn.jarvis-btn", { onclick: () => openTutor() }, icon("chat"), h("span", T("askJarvis")))));
}

function sidebar(active) {
  clear(side).append(
    h("div.side-group", NAV.map(([r, k, ic]) => h("a.side-link", { href: `#/${r}`, class: active === r ? "on" : "", onclick: () => document.body.classList.remove("side-open") }, icon(ic), h("span", T(k))))),
    h("div.side-foot", h("small", lang() === "bn" ? "Canadian University of Bangladesh · Data Structures & Algorithms II" : "Data Structures & Algorithms II · CUB")),
  );
}

async function route() {
  const parts = location.hash.replace(/^#\/?/, "").split("?")[0].split("/").map(decodeURIComponent);
  const key = ROUTES[parts[0]] ? parts[0] : "";
  sidebar(key);
  if (current && current.destroy) { try { current.destroy(); } catch (e) { console.error(e); } }
  current = null; clear(main); main.classList.remove("enter"); void main.offsetWidth; main.classList.add("enter");
  try { const mod = await ROUTES[key](); current = (await mod.render(main, parts.slice(1))) || null; }
  catch (e) { console.error(e); main.append(h("div.card.pad", h("h2", "Something went wrong"), h("pre", String(e.stack || e)))); }
  window.scrollTo({ top: 0 }); main.focus({ preventScroll: true });
  document.getElementById("streakN") && (document.getElementById("streakN").textContent = String(store.streak()));
}

function boot() {
  applyTheme();
  document.body.append(header(), h("div#shell", side, main), h("div#scrim", { onclick: () => document.body.classList.remove("side-open") }));
  window.addEventListener("hashchange", route);
  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openSearch(); }
    if (e.key === "Escape") document.body.classList.remove("side-open");
  });
  route();
  // Auto-integrate new files dropped into materials/ (and the course sheets) — no rebuild needed.
  const sync = () => syncServerFiles((doc) => !doc.analysis.isCore && toast(lang() === "bn" ? `নতুন উপকরণ যুক্ত হয়েছে: **${doc.name}**` : `New material integrated: **${doc.name}**`, "good", 3500)).catch(() => {});
  setTimeout(sync, 800); setInterval(sync, 45000);
}

const LOGO = `<svg viewBox="0 0 32 32" width="28" height="28"><rect x="2" y="2" width="28" height="28" rx="8" fill="var(--violet)" stroke="var(--ink)" stroke-width="2"/><path d="M16 9L10 17M16 9L22 17M10 17L7 24M10 17L13 24" stroke="var(--ink)" stroke-width="1.6" stroke-linecap="round"/><circle cx="16" cy="9" r="3.2" fill="var(--rust)" stroke="var(--ink)" stroke-width="1.4"/><circle cx="10" cy="17" r="2.8" fill="var(--green-3)" stroke="var(--ink)" stroke-width="1.4"/><circle cx="22" cy="17" r="2.8" fill="var(--gold)" stroke="var(--ink)" stroke-width="1.4"/><circle cx="7" cy="24" r="2.2" fill="var(--card)" stroke="var(--ink)" stroke-width="1.3"/><circle cx="13" cy="24" r="2.2" fill="var(--card)" stroke="var(--ink)" stroke-width="1.3"/></svg>`;

boot();
