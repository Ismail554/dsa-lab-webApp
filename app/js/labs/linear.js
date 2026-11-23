// Linear structures lab: stack, circular queue, singly linked list, hash table (chaining / linear probing), trie.
import { h, lang } from "../ui.js";
import { segmented, note, button } from "./kit.js";
import { vshell, player, svgBox, S, isoRect, cube, inputRow, parseNums } from "./viz.js";
import { stackOps, queueOps, listOp, hashInsert, trieBuild, ri, distinct } from "../dsa.js";

const W = 640, H = 340;
const label = (g, x, y, t, cls = "ax") => g.append(S("text", { x, y, "text-anchor": "middle", class: cls }, t));
const arrow = (g, x1, y1, x2, y2, cls = "") => g.append(S("line", { x1, y1, x2, y2, class: `ll-arrow ${cls}`, "marker-end": "url(#llarr)" }));
const defs = (svg) => svg.append(S("defs", {}, S("marker", { id: "llarr", viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" }, S("path", { d: "M0 0L10 5L0 10z", class: "g-arrow" }))));
const box = (x, y, w, hh, text, cls = "", d = 8) => S("g", { class: `cell3 ${cls}` }, isoRect({ x, y, width: w, height: hh }, d), S("text", { x: x + w / 2, y: y + hh / 2, dy: "0.35em", "text-anchor": "middle", class: "cell3-t" }, text === null || text === undefined ? "" : String(text)));

function drawStack(svg, f) {
  const n = f.st.length; const bh = Math.min(38, 260 / Math.max(6, n + 1)); const x = 240, w = 160;
  svg.append(S("line", { x1: x - 30, y1: 312, x2: x + w + 40, y2: 312, class: "t-edge" }));
  f.st.forEach((v, i) => svg.append(box(x, 312 - (i + 1) * bh, w, bh - 4, v, (f.hl || []).includes(i) ? "hl" : "")));
  if (n) { label(svg, x + w + 70, 312 - n * bh + bh / 2, "← top", "lbl"); }
  if (f.gone !== undefined) svg.append(box(x + w + 40, 40, 70, 34, f.gone, "bad"));
  label(svg, x + w / 2, 332, lang() === "bn" ? "stack (নিচ থেকে উপরে)" : "stack (bottom → top)");
}
function drawQueue(svg, f) {
  const cap = f.q.length; const cw = Math.min(80, 560 / cap); const x0 = (W - cw * cap) / 2, y = 140;
  f.q.forEach((v, i) => { svg.append(box(x0 + i * cw + 4, y, cw - 14, 56, v, [(f.hl || []).includes(i) ? "hl" : "", v === null ? "empty" : ""].join(" "))); label(svg, x0 + i * cw + cw / 2 - 5, y + 76, String(i)); });
  if (f.size) { label(svg, x0 + f.front * cw + cw / 2 - 5, y - 28, "front ↓", "lbl front"); if (f.rear >= 0) label(svg, x0 + f.rear * cw + cw / 2 - 5, y + 98, "↑ rear", "lbl rear"); }
  label(svg, W / 2, 300, `size = ${f.size} / ${cap}   ·   ${lang() === "bn" ? "শেষ ঘরের পরে আবার 0 তে ফেরে" : "after the last cell it wraps to 0"}`);
}
function drawList(svg, f) {
  defs(svg); const n = f.list.length; const cw = Math.min(96, 540 / Math.max(1, n + 1)); const y = 150; const x0 = 40;
  label(svg, x0 + 20, y - 34, "head", "lbl");
  f.list.forEach((v, i) => {
    const x = x0 + i * cw; const cls = [(f.hl || []).includes(i) ? "hl" : "", f.cur === i ? "hl" : "", f.gone === i ? "bad" : "", f.rev && i < f.rev ? "ok" : ""].join(" ");
    svg.append(box(x, y, cw * 0.62, 46, v, cls));
    if (i < n - 1) arrow(svg, x + cw * 0.62 + 9, y + 20, x + cw - 4, y + 20, f.rev && i < f.rev - 1 ? "back" : "");
    if (f.cur === i) label(svg, x + cw * 0.31, y + 72, "cur", "lbl");
  });
  const xe = x0 + n * cw; label(svg, xe + 14, y + 27, "null");
  if (f.newNode !== undefined) svg.append(box(x0, y - 110, cw * 0.62, 46, f.newNode, "hl"));
}
function drawHash(svg, f, mode) {
  defs(svg); const m = f.T.length;
  if (mode === "probe") {
    const cw = Math.min(78, 560 / m); const x0 = (W - cw * m) / 2, y = 140;
    f.T.forEach((v, i) => { svg.append(box(x0 + i * cw + 4, y, cw - 14, 54, v, [(f.hl || []).includes(i) ? ((f.bad || []).includes(i) ? "bad" : "hl") : "", v === null ? "empty" : ""].join(" "))); label(svg, x0 + i * cw + cw / 2 - 5, y + 76, String(i)); });
  } else {
    const rh = Math.min(42, 300 / m);
    f.T.forEach((chain, i) => {
      const y = 16 + i * rh; svg.append(box(70, y, 64, rh - 10, i, (f.hl || []).includes(i) ? "hl" : "slot", 6));
      chain.forEach((k, j) => { const x = 190 + j * 110; arrow(svg, (j ? x - 40 : 142), y + (rh - 10) / 2, x - 4, y + (rh - 10) / 2); svg.append(box(x, y, 70, rh - 10, k, (f.hl || []).includes(i) && j === chain.length - 1 ? "hl" : "", 6)); });
    });
  }
  if (f.key !== undefined) label(svg, W - 60, 24, `key = ${f.key}`, "lbl");
}
function drawTrie(svg, f) {
  const leaves = (n) => { const k = Object.values(n.kids); return k.length ? k.reduce((a, c) => a + leaves(c), 0) : 1; };
  const depth = (n) => 1 + Math.max(0, ...Object.values(n.kids).map(depth));
  const total = leaves(f.t), D = depth(f.t); const dx = Math.min(120, (W - 40) / total), dy = Math.min(80, (H - 40) / D);
  const ox = (W - dx * total) / 2; const edges = S("g"), nodes = S("g"); svg.append(edges, nodes);
  const place = (n, x0, d) => {
    const w = leaves(n) * dx; const x = x0 + w / 2, y = 26 + d * dy; let cx = x0;
    for (const k of Object.keys(n.kids).sort()) { const c = n.kids[k]; const [kx, ky] = place(c, cx, d + 1); edges.append(S("line", { x1: x, y1: y, x2: kx, y2: ky, class: `t-edge ${(f.path || []).includes(c.id) && (f.path || []).includes(n.id) ? "on" : ""}` })); cx += leaves(c) * dx; }
    nodes.append(S("g", { class: `t-node ${(f.path || []).includes(n.id) ? "hl" : ""} ${n.end ? "ok" : ""} ${f.endAt === n.id ? "sel" : ""}`, transform: `translate(${x},${y})` }, cube(19), S("text", { "text-anchor": "middle", dy: "0.35em" }, n.ch)));
    return [x, y];
  };
  place(f.t, ox, 0);
}

export default {
  id: "linear", icon: "cards",
  title: { en: "Stacks, Queues, Lists, Hashing & Tries Lab", bn: "Stack, Queue, List, Hashing ও Trie ল্যাব" },
  blurb: { en: "The everyday structures: push and pop a stack, wrap around a circular queue, re-link a linked list, hash keys with chaining or linear probing, and grow a trie letter by letter.", bn: "রোজকার data structure: stack এ push/pop, circular queue ঘুরে আসা, linked list এর link বদলানো, chaining বা linear probing দিয়ে hashing, আর অক্ষর ধরে trie বানানো।" },
  topics: ["stackqueue", "linkedlist", "hashing", "trie"],
  mount(host, preset = {}) {
    const bn = lang() === "bn";
    const s = Object.assign({ mode: "stack", sOps: "push 5, push 3, push 8, pop, peek, push 1, pop, pop", qOps: "enqueue 4, enqueue 7, enqueue 1, dequeue, enqueue 9, enqueue 2, dequeue, enqueue 6, enqueue 3", cap: 5, list: [10, 20, 30, 40], lop: "reverse", lx: 25, lpos: 2, keys: [10, 22, 31, 4, 15, 28, 17], m: 7, hmode: "chain", words: ["car", "cat", "cart", "dog", "do"], find: "ca" }, preset);
    const ui = vshell(host, preset);
    const draw = (f) => {
      const svg = svgBox(W, H);
      if (s.mode === "stack") drawStack(svg, f); else if (s.mode === "queue") drawQueue(svg, f); else if (s.mode === "list") drawList(svg, f); else if (s.mode === "hash") drawHash(svg, f, s.hmode); else drawTrie(svg, f);
      ui.view.replaceChildren(svg);
    };
    const P = player(ui, draw, { state: (f) => {
      if (s.mode === "stack") return [{ label: bn ? "Stack (নিচ → top)" : "Stack (bottom → top)", items: f.st, tone: "hot" }, { label: bn ? "Pop হয়েছে" : "Popped", items: f.out || [], tone: "ok" }];
      if (s.mode === "queue") return [{ label: "front, rear", items: [f.front, f.rear < 0 ? "—" : f.rear], tone: "hot" }, { label: bn ? "Dequeue হয়েছে" : "Dequeued", items: f.out || [], tone: "ok" }, { label: "size", items: [f.size] }];
      if (s.mode === "list") return [{ label: "List", items: f.list }, f.cur !== undefined ? { label: "cur", items: [f.list[f.cur]], tone: "hot" } : null];
      if (s.mode === "hash") return [f.key !== undefined ? { label: "h(k) = k mod m", items: [`${f.key} mod ${s.m} = ${((f.key % s.m) + s.m) % s.m}`], tone: "hot" } : null, { label: bn ? "Load factor α" : "Load factor α", items: [((s.hmode === "chain" ? f.T.reduce((a, c) => a + c.length, 0) : f.T.filter((x) => x !== null).length) / s.m).toFixed(2)] }];
      return [{ label: bn ? "শব্দ" : "Words", items: s.words }, s.find ? { label: "search", items: [s.find], tone: "hot" } : null];
    } });
    function run() {
      if (s.mode === "stack") P.load(stackOps(s.sOps.split(",")).frames, 0, "stack");
      else if (s.mode === "queue") P.load(queueOps(s.qOps.split(","), s.cap).frames, 0, "queue");
      else if (s.mode === "list") P.load(listOp(s.list, s.lop, s.lx, s.lpos).frames, 0, { head: "listHead", tail: "listTail", insert: "listInsert", delete: "listDelete", reverse: "listReverse" }[s.lop]);
      else if (s.mode === "hash") P.load(hashInsert(s.keys, s.m, s.hmode).frames, 0, s.hmode === "chain" ? "hashChain" : "hashProbe");
      else P.load(trieBuild(s.words, s.find || null).frames, 0, "trie");
      controls(); info();
    }
    const modeSeg = segmented([["stack", "stack"], ["queue", "circular queue"], ["list", "linked list"], ["hash", "hash table"], ["trie", "trie"]].map(([value, label]) => ({ value, label })), s.mode, (v) => { s.mode = v; run(); });
    const box2 = h("div.lab-controls");
    ui.controls.append(modeSeg, box2);
    function controls() {
      if (s.mode === "stack") box2.replaceChildren(inputRow("push 5, pop, peek …", s.sOps, bn ? "চালাও" : "Run", (v) => { s.sOps = v; run(); }));
      else if (s.mode === "queue") box2.replaceChildren(inputRow("enqueue 4, dequeue …", s.qOps, bn ? "চালাও" : "Run", (v) => { s.qOps = v; run(); }), inputRow("capacity", s.cap, "cap", (v) => { const c = parseNums(v)[0]; if (c >= 2 && c <= 9) { s.cap = c; run(); } }));
      else if (s.mode === "list") box2.replaceChildren(
        segmented([["head", "insert head"], ["tail", "insert tail"], ["insert", "insert at"], ["delete", "delete"], ["reverse", "reverse"]].map(([value, label]) => ({ value, label })), s.lop, (v) => { s.lop = v; run(); }),
        inputRow("list", s.list.join(", "), bn ? "সেট" : "Set", (v) => { const a = parseNums(v, 8); if (a.length) { s.list = a; run(); } }),
        inputRow(bn ? "মান x, অবস্থান" : "value x, position", `${s.lx}, ${s.lpos}`, "x", (v) => { const [x, p] = parseNums(v); if (x !== undefined) { s.lx = x; if (p !== undefined) s.lpos = p; run(); } }));
      else if (s.mode === "hash") box2.replaceChildren(
        segmented([{ value: "chain", label: "chaining" }, { value: "probe", label: "linear probing" }], s.hmode, (v) => { s.hmode = v; run(); }),
        inputRow("keys", s.keys.join(", "), bn ? "সেট" : "Set", (v) => { const a = parseNums(v, 12); if (a.length) { s.keys = a; run(); } }),
        inputRow("m", s.m, "m", (v) => { const m = parseNums(v)[0]; if (m >= 3 && m <= 13) { s.m = m; run(); } }),
        button(bn ? "এলোমেলো key" : "Random keys", () => { s.keys = distinct(ri(5, 8), 1, 99); run(); }, "small"));
      else box2.replaceChildren(inputRow(bn ? "শব্দ" : "words", s.words.join(", "), bn ? "সেট" : "Set", (v) => { const w = v.split(/[\s,]+/).map((x) => x.toLowerCase().replace(/[^a-z]/g, "")).filter(Boolean).slice(0, 8); if (w.length) { s.words = w; run(); } }),
        inputRow("search", s.find, bn ? "খোঁজো" : "Search", (v) => { s.find = v.trim().toLowerCase().replace(/[^a-z]/g, ""); run(); }));
    }
    function info() {
      const tips = {
        stack: bn ? "<b>Stack = LIFO</b> (শেষে ঢুকলে আগে বের)। push, pop, peek সব O(1)। ব্যবহার: function call stack, undo, bracket মেলানো, DFS।" : "<b>Stack = LIFO</b> (last in, first out). push, pop, peek are all O(1). Used for the call stack, undo, bracket matching, DFS.",
        queue: bn ? "<b>Queue = FIFO</b>। সাধারণ array তে সামনে থেকে সরালে জায়গা নষ্ট হয়; <b>circular</b> queue তে index mod capacity দিয়ে ঘুরে আসে — enqueue, dequeue O(1)। ব্যবহার: BFS, printer queue, CPU scheduling।" : "<b>Queue = FIFO</b>. A plain array wastes the front; a <b>circular</b> queue wraps indices mod capacity — enqueue and dequeue are O(1). Used for BFS, printer queues, scheduling.",
        list: bn ? "Linked list এ node গুলো memory তে ছড়ানো, প্রতিটা পরেরটার ঠিকানা রাখে। Head এ insert O(1), কিন্তু i-তম element পেতে O(n) হাঁটতে হয় (array তে O(1))।" : "Nodes are scattered in memory, each storing the next node's address. Insert at head is O(1), but reaching the i-th element is an O(n) walk (O(1) in an array).",
        hash: bn ? "Hash table: h(k) দিয়ে সরাসরি ঘরে যাও — গড়ে O(1)। একই ঘরে দুটো key = <b>collision</b>। Chaining: ঘরে একটা list; linear probing: পরের খালি ঘর। α = n/m বেশি হলে ধীর — তখন resize।" : "Jump straight to slot h(k) — O(1) on average. Two keys in one slot = a <b>collision</b>. Chaining keeps a list per slot; linear probing walks to the next free slot. High α = n/m slows it down → resize.",
        trie: bn ? "Trie: প্রতিটা edge একটা অক্ষর; একই শুরুর শব্দগুলো পথ ভাগ করে। Search/insert O(L), L = শব্দের দৈর্ঘ্য — কতগুলো শব্দ আছে তার উপর নির্ভর করে না। Autocomplete এ ব্যবহার হয়।" : "Each edge is a letter; words with the same start share a path. Search and insert are O(L) for a word of length L — independent of how many words are stored. Used for autocomplete.",
      };
      ui.info.replaceChildren(note(tips[s.mode]));
    }
    run();
    return { set(p) { Object.assign(s, p); modeSeg.set(s.mode); run(); }, destroy() { P.destroy(); } };
  },
};
