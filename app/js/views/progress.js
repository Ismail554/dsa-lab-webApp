// Progress dashboard: mastery, activity, weak-topic detection, interactive knowledge map (incl. uploaded topics).
import { h, L, T, lang, icon, toast, fmtDate } from "../ui.js";
import { store, docs } from "../store.js";
import { TOPICS, SETS, topicById } from "../content/curriculum.js";
import { pageHead, ring } from "./common.js";
import { libraryTopics } from "../ingest.js";

const DAY = 86400000;
export function weakTopics() {
  const bn = lang() === "bn";
  return TOPICS.map((t) => {
    const m = store.masteryOf(t.id); const at = store.attemptsOf(t.id); const recent = at.slice(-8); const acc = recent.length ? recent.filter((a) => a.ok).length / recent.length : null;
    const r = store.state.mastery[t.id]; const idle = r ? (Date.now() - r.last) / DAY : null;
    let reason, score = 1 - m;
    if (!at.length && !(store.state.lessons[t.id] || {}).done) { reason = bn ? "এখনো শুরু করা হয়নি" : "Not studied yet"; score += 0.05; }
    else if (acc !== null && acc < 0.6) { reason = bn ? `শেষ ${recent.length} চেষ্টায় ${Math.round(acc * 100)}% সঠিক` : `${Math.round(acc * 100)}% right in last ${recent.length} attempts`; score += 0.3; }
    else if (idle !== null && idle > 7) { reason = bn ? `${Math.round(idle)} দিন অনুশীলন হয়নি — ভুলে যাওয়ার ঝুঁকি` : `${Math.round(idle)} days since practice — fading`; score += 0.15; }
    else reason = bn ? `দক্ষতা ${Math.round(m * 100)}%` : `mastery ${Math.round(m * 100)}%`;
    // prerequisites of weak topics matter more
    const dependents = TOPICS.filter((x) => x.prereq.includes(t.id)).length; score += 0.04 * dependents;
    return { id: t.id, m, reason, score };
  }).filter((x) => x.m < 0.75).sort((a, b) => b.score - a.score);
}

export async function render(root) {
  const bn = lang() === "bn"; const st = store.state;
  const overall = TOPICS.reduce((a, t) => a + store.masteryOf(t.id), 0) / TOPICS.length;
  const doneLessons = TOPICS.filter((t) => (st.lessons[t.id] || {}).done).length;
  const acc = st.attempts.length ? st.attempts.filter((a) => a.ok).length / st.attempts.length : 0;
  const allDocs = await docs.all(); const lib = libraryTopics(allDocs);

  root.append(pageHead(T("progress"), bn ? "অগ্রগতি ও নলেজ ম্যাপ" : "Progress & knowledge map", bn ? "নোডে ক্লিক করলে লেসন খুলবে। রং = দক্ষতা।" : "Click a node to open it. Colour = mastery; arrows = prerequisites."));
  root.append(h("div.stats-row",
    stat(ring(overall, 64), bn ? "সামগ্রিক দক্ষতা" : "Overall mastery"), stat(h("b.big-num", `${doneLessons}/${TOPICS.length}`), bn ? "লেসন সম্পন্ন" : "Lessons completed"),
    stat(h("b.big-num", `${Math.round(acc * 100)}%`), bn ? `সঠিকতা (${st.attempts.length} চেষ্টা)` : `Accuracy (${st.attempts.length} attempts)`), stat(h("b.big-num", String(store.streak())), bn ? "দিনের স্ট্রিক" : "Day streak"),
    stat(h("b.big-num", String(Object.keys(st.solved || {}).length)), bn ? "প্রশ্ন সমাধান" : "Questions solved"), stat(h("b.big-num", String(st.exams.length)), bn ? "মক টেস্ট" : "Mock tests")));

  root.append(h("section.card.pad", h("h3", icon("map"), bn ? " নলেজ ম্যাপ" : " Knowledge map"), knowledgeMap(lib), h("div.map-legend", ...[["var(--line-strong)", bn ? "শুরু হয়নি" : "not started"], ["var(--rust)", "< 45%"], ["var(--gold)", "45–75%"], ["var(--green-3)", "≥ 75%"], ["var(--violet)", bn ? "আপলোড থেকে" : "from uploads"]].map(([c, l]) => h("span", h("i", { style: { background: c } }), l)))));

  const weak = weakTopics();
  root.append(h("div.two-col",
    h("section.card.pad", h("h3", icon("target"), " ", T("weak")), weak.length ? h("div.weak-list", weak.slice(0, 6).map((w) => h("div.weak-row", ring(w.m, 36), h("div.grow", h("b", L(topicById(w.id).title)), h("small", w.reason)), h("a.btn.small.primary", { href: `#/practice/topic/${w.id}` }, bn ? "ঠিক করো" : "Fix")))) : h("p", bn ? "দারুণ! কোনো দুর্বল টপিক নেই।" : "Great — no weak topics right now.")),
    h("section.card.pad", h("h3", icon("flame"), bn ? " গত ৪ সপ্তাহের কার্যকলাপ" : " Last 4 weeks"), heatmap(), activityChart())));

  root.append(h("section.card.pad", h("h3", bn ? "টপিক অনুযায়ী দক্ষতা" : "Mastery by topic"), ...SETS.map((s) => h("div.mastery-set", h("h4", s.code), TOPICS.filter((t) => t.set === s.id).map((t) => { const m = store.masteryOf(t.id); return h("a.bt-row", { href: `#/learn/${t.id}` }, h("span", L(t.title)), h("span.bar", h("i", { style: { width: `${m * 100}%`, background: m >= 0.75 ? "var(--green-3)" : m >= 0.45 ? "var(--gold)" : "var(--rust)" } })), h("b", `${Math.round(m * 100)}%`)); })))));

  root.append(h("section.card.pad.data-tools", h("h3", bn ? "ডেটা" : "Your data"), h("p.muted", bn ? "অগ্রগতি এই ব্রাউজারে সংরক্ষিত। অন্য ডিভাইসে নিতে এক্সপোর্ট করো।" : "Progress is stored in this browser. Export it to move devices or back it up."),
    h("div.row", h("button.btn", { onclick: () => { const b = new Blob([store.export()], { type: "application/json" }); const a = h("a", { href: URL.createObjectURL(b), download: `dsa-lab-progress-${new Date().toISOString().slice(0, 10)}.json` }); a.click(); } }, bn ? "এক্সপোর্ট" : "Export progress"),
      h("label.btn", bn ? "ইমপোর্ট" : "Import", h("input", { type: "file", accept: ".json", hidden: true, onchange: async (e) => { try { store.import(await e.target.files[0].text()); toast("Imported", "good"); location.reload(); } catch { toast("Invalid file", "bad"); } } })),
      h("button.btn.ghost", { onclick: () => { if (confirm(bn ? "সব অগ্রগতি মুছে ফেলবে?" : "Erase all progress?")) { store.reset(); location.reload(); } } }, bn ? "রিসেট" : "Reset"))));
}
const stat = (v, l) => h("div.card.stat-card", v, h("small", l));

function knowledgeMap(lib) {
  const W = 1000, H = 520, X = (c) => 90 + c * 164, Y = (r) => 70 + (r + 1.2) * 100;
  const nodes = TOPICS.map((t) => ({ id: t.id, x: X(t.pos[0]), y: Y(t.pos[1]), title: L(t.title), m: store.masteryOf(t.id), href: `#/learn/${t.id}`, set: t.set }));
  lib.forEach((l, k) => nodes.push({ id: l.id, x: X(k % 6) , y: Y(5.0) + Math.floor(k / 6) * 70, title: l.title, m: -1, href: `#/library/${l.doc}`, links: l.links, lib: true }));
  const Hh = Math.max(H, Math.max(...nodes.map((n) => n.y)) + 60);
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const edges = [];
  TOPICS.forEach((t) => t.prereq.forEach((p) => edges.push([byId[p], byId[t.id], false])));
  nodes.filter((n) => n.lib).forEach((n) => (n.links || []).forEach((l) => byId[l] && edges.push([byId[l], n, true])));
  const col = (m) => (m < 0 ? "var(--violet)" : m === 0 ? "var(--card-2)" : m < 0.45 ? "var(--rust-soft)" : m < 0.75 ? "var(--gold-soft)" : "var(--green)");
  const svg = `<svg viewBox="0 0 ${W} ${Hh}" class="kmap" role="img" aria-label="Knowledge map">
    <defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--muted)"/></marker></defs>
    <text x="20" y="${Y(-1.25)}" class="kmap-set">Midterm</text><text x="20" y="${Y(2.0)}" class="kmap-set">Final</text><text x="20" y="${Y(3.1)}" class="kmap-set">Extra</text>${lib.length ? `<text x="20" y="${Y(4.45)}" class="kmap-set">Library</text>` : ""}
    ${edges.map(([a, b, d]) => { if (!a || !b) return ""; const mx = (a.x + b.x) / 2; return `<path d="M${a.x + 62} ${a.y} C ${mx + 30} ${a.y}, ${mx - 30} ${b.y}, ${b.x - 66} ${b.y}" fill="none" stroke="var(--muted)" stroke-width="1.4" ${d ? 'stroke-dasharray="4 4"' : ""} marker-end="url(#arr)" opacity=".7"/>`; }).join("")}
    ${nodes.map((n) => `<a href="${n.href}" class="kmap-node"><g transform="translate(${n.x},${n.y})"><rect x="-68" y="-24" width="136" height="48" rx="12" fill="var(--ink)" transform="translate(2,3)"/><rect x="-68" y="-24" width="136" height="48" rx="12" fill="${col(n.m)}" stroke="var(--ink)" stroke-width="1.6"/>
      ${wrap(n.title).map((ln, k, arr) => `<text text-anchor="middle" y="${(k - (arr.length - 1) / 2) * 13 + 4}" class="kmap-t">${esc(ln)}</text>`).join("")}
      ${n.m >= 0 ? `<text x="62" y="-12" text-anchor="end" class="kmap-p">${Math.round(n.m * 100)}%</text>` : ""}</g></a>`).join("")}
  </svg>`;
  return h("div.kmap-wrap", { html: svg });
}
function wrap(s) { const w = s.split(/\s+/); const out = []; let cur = ""; for (const x of w) { if ((cur + " " + x).trim().length > 18) { out.push(cur.trim()); cur = x; } else cur += " " + x; } out.push(cur.trim()); return out.slice(0, 3); }
const esc = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

function heatmap() {
  const days = []; const counts = {};
  store.state.attempts.forEach((a) => { const d = new Date(a.ts).toISOString().slice(0, 10); counts[d] = (counts[d] || 0) + 1; });
  for (let k = 27; k >= 0; k--) { const d = new Date(Date.now() - k * DAY).toISOString().slice(0, 10); days.push([d, counts[d] || 0]); }
  const max = Math.max(1, ...days.map((d) => d[1]));
  return h("div.heat", days.map(([d, c]) => h("i", { title: `${d}: ${c}`, style: { opacity: c ? 0.25 + (0.75 * c) / max : 1, background: c ? "var(--green-3)" : "var(--line-soft)" } })));
}
function activityChart() {
  const ex = store.state.exams.slice(-10); if (!ex.length) return h("p.muted.small", lang() === "bn" ? "মক টেস্ট দিলে এখানে স্কোরের গ্রাফ আসবে।" : "Take mock tests to see your score trend here.");
  const W = 320, H = 90; const pts = ex.map((e, k) => [10 + (k * (W - 20)) / Math.max(1, ex.length - 1), H - 10 - (e.pct / 100) * (H - 20)]);
  return h("div", { html: `<svg viewBox="0 0 ${W} ${H}" class="trend"><line x1="0" x2="${W}" y1="${H - 10 - 0.7 * (H - 20)}" y2="${H - 10 - 0.7 * (H - 20)}" stroke="var(--line-strong)" stroke-dasharray="3 4"/><polyline points="${pts.map((p) => p.join(",")).join(" ")}" fill="none" stroke="var(--rust)" stroke-width="2.4"/>${pts.map((p, k) => `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="var(--card)" stroke="var(--ink)" stroke-width="1.5"><title>${fmtDate(ex[k].ts)}: ${Math.round(ex[k].pct)}%</title></circle>`).join("")}</svg><small class="muted">${lang() === "bn" ? "মক টেস্টের স্কোর (ড্যাশ = ৭০%)" : "Mock test scores (dashed = 70%)"}</small>` });
}
