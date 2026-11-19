// Visual toolkit for the DSA labs: SVG builder, frame player, array strips, tree & graph drawing.
import { h, L, icon, lang } from "../ui.js";

const NS = "http://www.w3.org/2000/svg";
/** S("rect", {x, y}, ...kids) — SVG element builder */
export function S(tag, attrs = {}, ...kids) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null && v !== false) el.setAttribute(k, v);
  for (const k of kids.flat(Infinity)) if (k != null && k !== false) el.append(k instanceof Node ? k : document.createTextNode(String(k)));
  return el;
}
export function svgBox(w, hh, cls = "") { return S("svg", { viewBox: `0 0 ${w} ${hh}`, class: `viz-svg ${cls}`, preserveAspectRatio: "xMidYMid meet", role: "img" }); }

/** Standard lab layout: stage (viz area + message bar + player) | side panel. */
export function vshell(host, preset = {}) {
  host.classList.add("lab", "vlab"); if (preset.compact) host.classList.add("compact");
  const view = h("div.viz-view"); const msgBar = h("div.viz-msg"); const bar = h("div.viz-bar");
  const stage = h("div.lab-stage.viz-stage", view, msgBar, bar);
  const controls = h("div.lab-controls"); const info = h("div.lab-info");
  host.append(stage, h("div.lab-panel", controls, info));
  return { stage, view, msgBar, bar, controls, info };
}

/**
 * Frame player. frames: [{msg:{en,bn}, ...}], draw(frame, index).
 * Returns { load(frames, at), go(i), destroy(), get i() }
 */
export function player(ui, draw, { speed = 1, autoplay = false } = {}) {
  let frames = [], i = 0, timer = null, sp = speed;
  const bn = () => lang() === "bn";
  const pos = h("input.viz-pos", { type: "range", min: 0, max: 0, value: 0, step: 1 });
  const count = h("span.viz-count");
  const playBtn = h("button.icon-btn", { title: "Play / pause", onclick: () => (timer ? stop() : play()) }, icon("play"));
  const spd = h("select.viz-speed", { title: "Speed" }, [["0.5", "0.5×"], ["1", "1×"], ["2", "2×"], ["4", "4×"]].map(([v, l]) => h("option", { value: v, selected: +v === sp ? true : null }, l)));
  spd.addEventListener("change", () => { sp = +spd.value; if (timer) { stop(); play(); } });
  pos.addEventListener("input", () => { stop(); go(+pos.value); });
  ui.bar.replaceChildren(
    h("button.icon-btn", { title: "First", onclick: () => { stop(); go(0); } }, "⏮"),
    h("button.icon-btn", { title: "Step back", onclick: () => { stop(); go(i - 1); } }, icon("left")),
    playBtn,
    h("button.icon-btn", { title: "Step forward", onclick: () => { stop(); go(i + 1); } }, icon("arrow")),
    h("button.icon-btn", { title: "Last", onclick: () => { stop(); go(frames.length - 1); } }, "⏭"),
    pos, count, spd);
  function go(k) {
    if (!frames.length) return;
    i = Math.max(0, Math.min(frames.length - 1, k)); pos.value = i; count.textContent = `${i + 1}/${frames.length}`;
    const f = frames[i]; ui.msgBar.innerHTML = ""; ui.msgBar.append(h("b", `${bn() ? "ধাপ" : "Step"} ${i + 1}: `), L(f.msg) || "");
    ui.msgBar.classList.toggle("done", !!f.done);
    draw(f, i);
  }
  function play() { if (i >= frames.length - 1) go(0); playBtn.replaceChildren(icon("pause")); timer = setInterval(() => { if (i >= frames.length - 1) return stop(); go(i + 1); }, 900 / sp); }
  function stop() { clearInterval(timer); timer = null; playBtn.replaceChildren(icon("play")); }
  return {
    load(fr, at = 0) { stop(); frames = fr || []; pos.max = Math.max(0, frames.length - 1); go(at === "end" ? frames.length - 1 : at); if (autoplay) play(); },
    go, play, stop, get i() { return i; }, get n() { return frames.length; },
    destroy() { stop(); },
  };
}

/** Array strip: values with index labels and highlight classes. */
export function arrayStrip(values, { hl = [], ok = [], swap = [], dim = (k) => false, idx = true, one = false, cls = "", mark = {} } = {}) {
  return h(`div.arr${cls ? "." + cls : ""}`, values.map((v, k) => h("div.arr-cell", {
    class: [hl.includes(k) ? "hl" : "", ok.includes(k) ? "ok" : "", swap.includes(k) ? "sw" : "", dim(k) ? "dim" : "", mark[k] || ""].join(" "),
  }, h("span.arr-v", v === null || v === undefined ? "" : String(v)), idx ? h("small.arr-i", String(one ? k + 1 : k)) : null)));
}

/** Layout a binary tree given by accessor functions → [{node, x, y, parent}] (x by in-order, y by depth). */
export function layoutBinary(root, { left = (n) => n.l, right = (n) => n.r } = {}) {
  const out = []; let x = 0; let depth = 0;
  const walk = (n, d, parent) => { if (!n) return; walk(left(n), d + 1, n); const me = { node: n, x: x++, y: d, parent }; out.push(me); depth = Math.max(depth, d); walk(right(n), d + 1, n); };
  walk(root, 0, null);
  return { items: out, width: x, depth };
}

/** Draw a binary tree into an SVG. nodes: layout items; label(n), cls(n) */
export function drawBinary(svg, lay, { label = (n) => n.k, cls = () => "", sub = null, W = 640, H = 360, r = 18 } = {}) {
  const pos = new Map(); const cols = Math.max(1, lay.width); const rows = Math.max(1, lay.depth + 1);
  const dx = Math.min(70, (W - 40) / cols), dy = Math.min(78, (H - 50) / rows);
  const ox = (W - dx * (cols - 1)) / 2;
  lay.items.forEach((it) => pos.set(it.node, [ox + it.x * dx, 32 + it.y * dy]));
  const g = S("g");
  lay.items.forEach((it) => { if (it.parent) { const [x1, y1] = pos.get(it.parent), [x2, y2] = pos.get(it.node); g.append(S("line", { x1, y1, x2, y2, class: "t-edge" })); } });
  lay.items.forEach((it) => {
    const [x, y] = pos.get(it.node);
    g.append(S("g", { class: `t-node ${cls(it.node)}`, transform: `translate(${x},${y})` }, S("circle", { r }), S("text", { "text-anchor": "middle", dy: "0.35em" }, String(label(it.node))), sub ? S("text", { class: "t-sub", "text-anchor": "middle", y: r + 13 }, sub(it.node)) : null));
  });
  svg.append(g); return pos;
}

/** Complete binary tree from an array (heap view). */
export function heapTree(a, n = a.length) {
  const nodes = a.map((v, i) => ({ k: v, i, l: null, r: null }));
  nodes.forEach((nd, i) => { if (2 * i + 1 < a.length) nd.l = nodes[2 * i + 1]; if (2 * i + 2 < a.length) nd.r = nodes[2 * i + 2]; });
  return nodes[0] || null;
}

/** Draw a graph. G = {n, edges, pos:[[x,y]], labels, directed}. State: vis[], cur, edge, tree[], reject, dist[] */
export function drawGraph(svg, G, st = {}, { W = 640, H = 380, weights = true, sub = null } = {}) {
  const P = G.pos.map(([x, y]) => [30 + x * (W - 60), 30 + y * (H - 60)]);
  const r = 19;
  svg.append(S("defs", {}, S("marker", { id: "garr", viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" }, S("path", { d: "M0 0L10 5L0 10z", class: "g-arrow" }))));
  G.edges.forEach((e, idx) => {
    const [x1, y1] = P[e.u], [x2, y2] = P[e.v]; const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
    const sx = x1 + (dx / len) * r, sy = y1 + (dy / len) * r, ex = x2 - (dx / len) * (r + (G.directed ? 3 : 0)), ey = y2 - (dy / len) * (r + (G.directed ? 3 : 0));
    const c = [(st.tree || []).includes(idx) ? "tree" : "", st.edge === idx ? "act" : "", st.reject === idx ? "rej" : ""].join(" ");
    svg.append(S("line", { x1: sx, y1: sy, x2: ex, y2: ey, class: `g-edge ${c}`, "marker-end": G.directed ? "url(#garr)" : null }));
    if (weights && e.w !== undefined) { const mx = (x1 + x2) / 2 - (dy / len) * 11, my = (y1 + y2) / 2 + (dx / len) * 11; svg.append(S("g", { class: `g-w ${c}` }, S("rect", { x: mx - 11, y: my - 9, width: 22, height: 18, rx: 5 }), S("text", { x: mx, y: my, "text-anchor": "middle", dy: "0.35em" }, String(e.w)))); }
  });
  P.forEach(([x, y], k) => {
    const c = [(st.vis || []).includes(k) ? "vis" : "", st.cur === k ? "cur" : "", (st.fin || []).includes(k) ? "fin" : ""].join(" ");
    svg.append(S("g", { class: `g-node ${c}`, transform: `translate(${x},${y})` }, S("circle", { r }), S("text", { "text-anchor": "middle", dy: "0.35em" }, (G.labels || "ABCDEFGHIJ")[k]),
      sub ? S("text", { class: "g-sub", "text-anchor": "middle", y: -r - 6 }, sub(k)) : null));
  });
  return P;
}

/** Bars for sorting: values → svg bars with classes */
export function bars(svg, a, { W = 640, H = 300, cls = () => "", max = Math.max(...a, 1) } = {}) {
  const n = a.length; const bw = (W - 40) / n;
  a.forEach((v, k) => {
    const hh = 24 + ((H - 70) * v) / max; const x = 20 + k * bw, y = H - 30 - hh;
    svg.append(S("g", { class: `bar ${cls(k)}` }, S("rect", { x: x + 3, y, width: bw - 6, height: hh, rx: 5 }), S("text", { x: x + bw / 2, y: y - 6, "text-anchor": "middle" }, String(v)), S("text", { class: "bar-i", x: x + bw / 2, y: H - 12, "text-anchor": "middle" }, String(k))));
  });
}

/** Parse "5, 3, 8 1" → numbers */
export function parseNums(s, max = 16) { return String(s).split(/[\s,;]+/).map(Number).filter((x) => Number.isFinite(x)).slice(0, max); }

/** Text input + button row. */
export function inputRow(placeholder, value, btnLabel, onGo) {
  const inp = h("input.inp", { placeholder, value: value ?? "" });
  const go = () => onGo(inp.value, inp);
  inp.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
  const el = h("div.inrow", inp, h("button.btn.small.primary", { onclick: go, type: "button" }, btnLabel));
  el.input = inp; return el;
}

/** Simple table for DP. T: 2D array; rowHead, colHead: arrays; state: cell [i,j], from [[i,j]], path [[i,j]] */
export function dpTable(T, { rowHead = [], colHead = [], cell = null, from = [], path = [], blank = (v) => v === null || v === undefined, fmt = (v) => v } = {}) {
  const isIn = (arr, i, j) => arr.some(([a, b]) => a === i && b === j);
  return h("table.dp", h("tr", h("th", ""), colHead.map((c) => h("th", String(c)))),
    T.map((row, i) => h("tr", h("th", String(rowHead[i] ?? i)), row.map((v, j) => h("td", { class: [cell && cell[0] === i && cell[1] === j ? "cur" : "", isIn(from, i, j) ? "from" : "", isIn(path, i, j) ? "path" : "", blank(v) ? "blank" : ""].join(" ") }, blank(v) ? "" : String(fmt(v)))))));
}
