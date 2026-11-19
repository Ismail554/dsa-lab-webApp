// Persistent learner state (localStorage) + IndexedDB for uploaded documents.
const KEY = "complexlab.v1";
const DAY = 86400000;

const fresh = () => ({
  v: 1, lang: "bn", langSet: false, theme: null, created: Date.now(),
  lessons: {},     // topicId -> { step, done, ts }
  mastery: {},     // topicId -> { m: 0..1, n: attempts, last: ts }
  attempts: [],    // { qid, topic, ok, ts, kind }
  cards: {},       // cardId -> { box: 0..5, due: ts, seen }
  feynman: {},     // topicId -> { text, score, ts }
  exams: [],       // { ts, score, total, pct, byTopic, set }
  days: [],        // yyyy-mm-dd study days (streak)
  labsUsed: {},    // labId -> count
  bookmarks: [],
});

let state;
try { state = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || "{}")); } catch { state = fresh(); }
// Bangla is the default teaching language; only an explicit choice via the language button overrides it.
if (!state.langSet) state.lang = "bn";

const listeners = new Set();
let saveTimer;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} }, 120);
  listeners.forEach((fn) => { try { fn(state); } catch (e) { console.error(e); } });
}
const today = () => new Date().toISOString().slice(0, 10);
function touchDay() { const d = today(); if (state.days[state.days.length - 1] !== d) state.days.push(d); if (state.days.length > 400) state.days.shift(); }

export const store = {
  get state() { return state; },
  on(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  set(patch) { Object.assign(state, patch); save(); },
  reset() { state = fresh(); save(); },
  export() { return JSON.stringify(state, null, 2); },
  import(json) { state = Object.assign(fresh(), JSON.parse(json)); save(); },

  /** Record a graded attempt on a topic. weight: how strongly it moves mastery. */
  record(topic, ok, { qid = null, kind = "practice", weight = 1 } = {}) {
    if (!topic) return;
    const ts = Date.now(); touchDay();
    state.attempts.push({ qid, topic, ok: ok ? 1 : 0, ts, kind });
    if (state.attempts.length > 3000) state.attempts.splice(0, state.attempts.length - 3000);
    const cur = state.mastery[topic] || { m: 0.25, n: 0, last: ts };
    const k = Math.min(0.45, (0.22 + 0.5 / (cur.n + 2)) * weight);
    cur.m = Math.max(0, Math.min(1, cur.m + k * ((ok ? 1 : 0) - cur.m)));
    cur.n += 1; cur.last = ts; state.mastery[topic] = cur; save();
  },
  lessonProgress(topic, step, total, done = false) {
    const cur = state.lessons[topic] || { step: 0, done: false };
    cur.step = Math.max(cur.step || 0, step); cur.total = total; cur.ts = Date.now();
    if (done && !cur.done) { cur.done = true; const m = state.mastery[topic] || { m: 0.25, n: 0 }; m.m = Math.max(m.m, 0.5); m.last = Date.now(); state.mastery[topic] = m; }
    state.lessons[topic] = cur; touchDay(); save();
  },
  useLab(id) { state.labsUsed[id] = (state.labsUsed[id] || 0) + 1; touchDay(); save(); },

  /** Mastery with a gentle forgetting curve (half-life ~ 3 weeks without practice). */
  masteryOf(topic) {
    const r = state.mastery[topic]; if (!r) return 0;
    const days = (Date.now() - (r.last || Date.now())) / DAY;
    return r.m * Math.pow(0.5, Math.max(0, days - 2) / 21);
  },
  attemptsOf(topic) { return state.attempts.filter((a) => a.topic === topic); },

  // ---- Leitner spaced repetition for formula / definition cards ----
  cardDue(id) { const c = state.cards[id]; return !c || c.due <= Date.now(); },
  gradeCard(id, ok, topic) {
    const c = state.cards[id] || { box: 0, due: 0, seen: 0 };
    c.box = ok ? Math.min(5, c.box + 1) : 0; c.seen++;
    const gaps = [0.004, 1, 2, 4, 9, 21];
    c.due = Date.now() + gaps[c.box] * DAY; state.cards[id] = c;
    if (topic) this.record(topic, ok, { kind: "card", weight: 0.35 }); else save();
  },

  streak() {
    const set = new Set(state.days); let n = 0; const d = new Date();
    if (!set.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1);
    while (set.has(d.toISOString().slice(0, 10))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  },
};

// ---------------- IndexedDB (uploaded documents) ----------------
let dbp;
function db() {
  if (!dbp) dbp = new Promise((res, rej) => {
    const r = indexedDB.open("complexlab", 1);
    r.onupgradeneeded = () => { r.result.createObjectStore("docs", { keyPath: "id" }); };
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
  return dbp;
}
async function tx(mode, fn) { const d = await db(); return new Promise((res, rej) => { const t = d.transaction("docs", mode); const s = t.objectStore("docs"); const out = fn(s); t.oncomplete = () => res(out && out.result !== undefined ? out.result : out); t.onerror = () => rej(t.error); }); }
export const docs = {
  async all() { try { return (await tx("readonly", (s) => s.getAll())) || []; } catch { return []; } },
  put(doc) { return tx("readwrite", (s) => s.put(doc)); },
  remove(id) { return tx("readwrite", (s) => s.delete(id)); },
};
