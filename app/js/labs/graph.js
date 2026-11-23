// Graph lab: representations (matrix / list), BFS, DFS, Dijkstra, Bellman-Ford, Prim, Kruskal — step by step.
import { h, L, lang } from "../ui.js";
import { segmented, note, button } from "./kit.js";
import { vshell, player, svgBox, drawGraph } from "./viz.js";
import { bfs, dfs, dijkstra, bellmanFord, prim, kruskal, topo, adj, LETTERS } from "../dsa.js";

const E = (u, v, w) => ({ u: LETTERS.indexOf(u), v: LETTERS.indexOf(v), w });
export const GRAPHS = {
  weighted: { name: { en: "weighted (6)", bn: "weighted (৬)" }, n: 6, directed: false, pos: [[0, 0.5], [0.33, 0.05], [0.33, 0.95], [0.67, 0.05], [0.67, 0.95], [1, 0.5]],
    edges: [E("A", "B", 4), E("A", "C", 2), E("B", "C", 1), E("B", "D", 5), E("C", "D", 8), E("C", "E", 10), E("D", "E", 2), E("D", "F", 6), E("E", "F", 3)] },
  tree8: { name: { en: "unweighted (8)", bn: "unweighted (৮)" }, n: 8, directed: false, pos: [[0.5, 0], [0.22, 0.33], [0.78, 0.33], [0.05, 0.7], [0.38, 0.7], [0.65, 0.7], [0.95, 0.7], [0.52, 1]],
    edges: [E("A", "B"), E("A", "C"), E("B", "D"), E("B", "E"), E("C", "F"), E("C", "G"), E("E", "H"), E("F", "H")] },
  negative: { name: { en: "directed, negative edges", bn: "directed, negative edge" }, n: 5, directed: true, pos: [[0, 0.5], [0.45, 0.05], [0.45, 0.95], [1, 0.05], [1, 0.95]],
    edges: [E("A", "B", 6), E("A", "C", 7), E("B", "C", 8), E("B", "D", 5), E("B", "E", -4), E("C", "D", -3), E("C", "E", 9), E("D", "B", -2), E("E", "D", 7), E("E", "A", 2)] },
  directed: { name: { en: "directed (6)", bn: "directed (৬)" }, n: 6, directed: true, pos: [[0, 0.2], [0.35, 0], [0.35, 0.7], [0.7, 0.2], [0.7, 0.95], [1, 0.5]],
    edges: [E("A", "B", 3), E("A", "C", 1), E("C", "B", 1), E("B", "D", 2), E("C", "E", 6), E("D", "E", 1), E("D", "F", 7), E("E", "F", 2)] },
};
const ALGOS = { bfs, dfs, dijkstra, bellman: bellmanFord, prim, kruskal, topo };

export default {
  id: "graph", icon: "map",
  title: { en: "Graph Algorithms Lab", bn: "Graph Algorithm ল্যাব" },
  blurb: { en: "One graph, many algorithms: adjacency matrix & list, BFS, DFS, Dijkstra, Bellman-Ford, Prim and Kruskal — queue, stack and distance table shown at every step.", bn: "একটা graph, অনেক algorithm: adjacency matrix ও list, BFS, DFS, Dijkstra, Bellman-Ford, Prim ও Kruskal — প্রতি ধাপে queue, stack আর distance table।" },
  topics: ["graphs", "bfsdfs", "shortest", "mst"],
  mount(host, preset = {}) {
    const bn = lang() === "bn";
    const s = Object.assign({ g: "weighted", algo: "bfs", src: 0, rep: "list" }, preset);
    const ui = vshell(host, preset);
    let frame = {};
    const G = () => GRAPHS[s.g];
    const draw = (f) => {
      frame = f; const g = G(); const svg = svgBox(640, 380);
      const showDist = ["dijkstra", "bellman"].includes(s.algo) || (s.algo === "bfs" && f.dist);
      drawGraph(svg, g, f, { weights: !["bfs", "dfs"].includes(s.algo) || g.edges[0].w !== undefined, sub: showDist && f.dist ? (k) => (f.dist[k] === Infinity ? "∞" : String(f.dist[k])) : null });
      svg.addEventListener("click", (e) => { const n = e.target.closest(".g-node"); if (!n || ["kruskal"].includes(s.algo)) return; s.src = [...svg.querySelectorAll(".g-node")].indexOf(n); run(); });
      ui.view.replaceChildren(svg); side();
    };
    const P = player(ui, draw, { state: (f) => {
      const bn = lang() === "bn"; const lab = (k) => LETTERS[k]; const g = G(); const E = (i) => `${lab(g.edges[i].u)}${lab(g.edges[i].v)}`;
      if (s.algo === "bfs") return [{ label: bn ? "Queue (সামনে আগে)" : "Queue (front first)", items: (f.q || []).map(lab), tone: "hot" }, { label: bn ? "বের হয়েছে" : "Finished", items: (f.order || []).map(lab), tone: "ok" }];
      if (s.algo === "dfs") return [{ label: bn ? "Call stack (উপরে শেষ)" : "Call stack (top last)", items: (f.stack || []).map(lab), tone: "hot" }, { label: bn ? "শেষ হয়েছে" : "Finished", items: (f.fin || []).map(lab), tone: "ok" }];
      if (s.algo === "dijkstra" || s.algo === "bellman") return [f.cur !== undefined ? { label: bn ? "এখন" : "Now at", items: [lab(f.cur)], tone: "hot" } : null, { label: bn ? "Final হয়েছে" : "Finalised", items: (f.vis || []).map(lab), tone: "ok" }, f.pass ? { label: "pass", items: [f.pass] } : null];
      if (s.algo === "prim" || s.algo === "kruskal") return [{ label: bn ? "Tree এর edge" : "Tree edges", items: (f.tree || []).map(E), tone: "ok" }, { label: bn ? "মোট weight" : "Total weight", items: [(f.tree || []).reduce((a, i) => a + g.edges[i].w, 0)] }, f.reject !== undefined ? { label: bn ? "বাদ (cycle)" : "Skipped (cycle)", items: [E(f.reject)], tone: "bad" } : null];
      if (s.algo === "topo") return [{ label: "Ready (indeg 0)", items: (f.ready || []).map(lab), tone: "hot" }, { label: "Output", items: (f.order || []).map(lab), tone: "ok" }, f.indeg ? { label: "indeg", items: f.indeg.map((d, k) => `${lab(k)}:${d}`) } : null];
      return [];
    } });
    function run() { const g = G(); if (s.src >= g.n) s.src = 0; if (s.algo === "rep") P.load([{ msg: { en: "Click a vertex to set the source. Switch the panel between adjacency list and matrix.", bn: "Source বদলাতে vertex এ ক্লিক করো। প্যানেলে adjacency list বা matrix দেখো।" } }]); else P.load(ALGOS[s.algo](g, s.src).frames, 0, s.algo); }
    const algoSeg = segmented([["rep", { en: "represent", bn: "representation" }], ["bfs", "BFS"], ["dfs", "DFS"], ["dijkstra", "Dijkstra"], ["bellman", "Bellman-Ford"], ["prim", "Prim"], ["kruskal", "Kruskal"], ["topo", "Topological sort"]].map(([value, label]) => ({ value, label })), s.algo, (v) => {
      s.algo = v;
      if (v === "bellman" && s.g !== "negative") { s.g = "negative"; gSeg.set("negative"); }
      if (["prim", "kruskal"].includes(v) && GRAPHS[s.g].directed) { s.g = "weighted"; gSeg.set("weighted"); }
      if (v === "dijkstra" && s.g === "negative") { s.g = "weighted"; gSeg.set("weighted"); }
      if (v === "topo") { s.g = "directed"; gSeg.set("directed"); }
      run();
    });
    const gSeg = segmented(Object.entries(GRAPHS).map(([value, g]) => ({ value, label: g.name })), s.g, (v) => { s.g = v; s.src = 0; run(); });
    const repSeg = segmented([{ value: "list", label: { en: "adjacency list", bn: "adjacency list" } }, { value: "matrix", label: { en: "adjacency matrix", bn: "adjacency matrix" } }], s.rep, (v) => { s.rep = v; side(); });
    ui.controls.append(algoSeg, gSeg, repSeg);
    function side() {
      const g = G(); const f = frame; const lab = (k) => LETTERS[k];
      const rep = s.rep === "list"
        ? h("div.adjlist", adj(g).map((l, u) => h("div", h("b", `${lab(u)} → `), l.map((x) => `${lab(x.v)}${x.w !== undefined && g.edges[0].w !== undefined ? `(${x.w})` : ""}`).join(", ") || "∅")))
        : h("table.dp.small", h("tr", h("th", ""), Array.from({ length: g.n }, (_, k) => h("th", lab(k)))), Array.from({ length: g.n }, (_, u) => h("tr", h("th", lab(u)), Array.from({ length: g.n }, (_, v) => { const e = g.edges.find((e) => (e.u === u && e.v === v) || (!g.directed && e.u === v && e.v === u)); return h("td", { class: e ? "from" : "" }, e ? String(e.w ?? 1) : "0"); }))));
      const ds = [];
      if (f.dist && s.algo !== "bfs") ds.push(h("table.dp.small", h("tr", h("th", "v"), Array.from({ length: g.n }, (_, k) => h("th", lab(k)))), h("tr", h("th", "dist"), f.dist.map((d, k) => h("td", { class: (f.vis || []).includes(k) ? "path" : "" }, d === Infinity ? "∞" : String(d))))));
      const tips = {
        rep: bn ? "Matrix: O(V²) জায়গা, edge আছে কিনা O(1)। List: O(V+E) জায়গা, sparse graph এর জন্য ভালো।" : "Matrix: O(V²) space, O(1) edge test. List: O(V+E) space — best for sparse graphs.",
        bfs: bn ? "BFS: queue (FIFO), level-by-level; unweighted graph এ shortest path দেয়। O(V+E)।" : "BFS: a FIFO queue, level by level; gives shortest paths in unweighted graphs. O(V+E).",
        dfs: bn ? "DFS: stack/recursion, যতদূর যাওয়া যায় যাও তারপর backtrack। Cycle খোঁজা, topological sort এ কাজে লাগে। O(V+E)।" : "DFS: a stack (recursion) — go as deep as possible, then backtrack. Used for cycles and topological sort. O(V+E).",
        dijkstra: bn ? "Dijkstra: greedy, সবচেয়ে কম dist এর vertex final করো। Negative edge চলবে না। Binary heap দিয়ে O((V+E) log V)।" : "Dijkstra: greedy — finalise the closest unvisited vertex. No negative edges. O((V+E) log V) with a binary heap.",
        bellman: bn ? "Bellman-Ford: সব edge |V|−1 বার relax। Negative edge চলে, negative cycle ধরতে পারে। O(VE)।" : "Bellman-Ford: relax every edge |V|−1 times. Handles negative edges and detects negative cycles. O(VE).",
        prim: bn ? "Prim: একটা vertex থেকে tree বড় করো, প্রতিবার tree থেকে বের হওয়া সবচেয়ে সস্তা edge নাও।" : "Prim: grow one tree, always adding the cheapest edge that leaves it.",
        topo: bn ? "Topological sort (Kahn): in-degree 0 এর vertex আগে বের করো, তার edge মুছে ফেলো। শুধু DAG (cycle নেই এমন directed graph) এ চলে। O(V+E)।" : "Topological sort (Kahn): output a vertex with in-degree 0, delete its edges, repeat. Works only on a DAG (directed, no cycle). O(V+E).",
        kruskal: bn ? "Kruskal: edge গুলো weight অনুযায়ী সাজাও, cycle না হলে নাও (union-find)। O(E log E)।" : "Kruskal: sort edges by weight, take each one that joins two components (union-find). O(E log E).",
      };
      ui.info.replaceChildren(...ds, note(tips[s.algo]), h("h4", s.rep === "list" ? "Adjacency list" : "Adjacency matrix"), rep);
    }
    run();
    return { set(p) { Object.assign(s, p); algoSeg.set(s.algo); gSeg.set(s.g); run(); }, destroy() { P.destroy(); } };
  },
};
