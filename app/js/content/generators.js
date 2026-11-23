// Procedural problem generators — unlimited fresh practice, auto-checked, with step-by-step solutions.
// Answers are computed by the same engine (dsa.js) that drives the labs.
import * as D from "../dsa.js";

const { ri, pick, distinct, shuffle } = D;
const arr = (a) => `[${a.join(", ")}]`;
const fld = (label, ans, kind, o = {}) => ({ label, ans: String(ans), kind, ...o });
const L = (k) => D.LETTERS[k];
const swapsText = (frames) => frames.filter((f) => f.swap).map((f) => arr(f.a));
const WEDGES = [[0, 1], [0, 2], [1, 2], [1, 3], [2, 3], [2, 4], [3, 4], [3, 5], [4, 5]];
const UEDGES = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6], [4, 7], [5, 7]];
const gW = () => ({ n: 6, directed: false, edges: WEDGES.map(([u, v]) => ({ u, v, w: ri(1, 12) })) });
const edgeList = (G) => G.edges.map((e) => `${L(e.u)}${L(e.v)}${e.w !== undefined ? `(${e.w})` : ""}`).join(", ");
const powTex = (k) => (k === 0 ? "" : k === 1 ? "n" : `n^{${k}}`);
const logTex = (p) => (p === 0 ? "" : p === 1 ? "\\log n" : p === -1 ? "/\\log n" : p < 0 ? `/\\log^{${-p}} n` : `\\log^{${p}} n`);

export const GENERATORS = [
  { id: "g-loop", topic: "analysis", name: "Loop complexity", make() {
    const L1 = [["for (i = 0; i < n; i++)", "n", "n"], ["for (i = 1; i < n; i *= 2)", "log n", "\\log n"], ["for (i = n; i > 0; i /= 3)", "log n", "\\log n"], ["for (i = 0; i * i < n; i++)", "sqrt(n)", "\\sqrt n"]];
    const a = pick(L1), b = pick(L1); const nested = Math.random() < 0.7;
    const g = D.growth(nested ? `(${a[1]})*(${b[1]})` : `(${a[1]})+(${b[1]})`);
    return { q: `Give the tight bound of the number of times \`x++\` runs:\n\`${a[0]}\` ${nested ? `{ \`${b[0]}\` x++; }` : `x++;  then  \`${b[0]}\` x++;`}`, fields: [fld("Θ", nested ? `(${a[1]})*(${b[1]})` : `(${a[1]})+(${b[1]})`, "bigo")],
      solution: [`Outer: $\\Theta(${a[2]})$ iterations; ${nested ? "inner" : "second loop"}: $\\Theta(${b[2]})$.`, nested ? "Nested loops multiply." : "Sequential loops add — keep the larger.", `Answer: $\\Theta(${D.growthTex(g)})$.`] };
  } },
  { id: "g-order", topic: "analysis", name: "Dominant term", make() {
    const terms = shuffle(["n^3", "n^2 log n", "n log n", "2^n", "sqrt(n)", "n^2", "100n", "log n", "n!"]).slice(0, 3);
    const best = terms.reduce((a, b) => (D.cmpGrowth(D.growth(a), D.growth(b)) >= 0 ? a : b));
    const c = terms.map((t) => `${ri(2, 9)}${t.startsWith("1") ? "" : "\\,"}${t.replace("sqrt(n)", "\\sqrt n").replace("log", "\\log ").replace("100n", "n")}`).join(" + ");
    return { q: `Simplify to Θ-notation: $T(n) = ${c}$.`, fields: [fld("Θ", best, "bigo")], solution: ["Keep the fastest-growing term and drop its constant.", `Ladder: $1<\\log n<\\sqrt n<n<n\\log n<n^2<n^2\\log n<n^3<2^n<n!$.`, `Answer: $\\Theta(${D.growthTex(D.growth(best))})$.`] };
  } },
  { id: "g-space", topic: "space", name: "Space of a snippet", make() {
    const c = pick([["int[] a = new int[n];", "n"], ["int[][] m = new int[n][n];", "n^2"], ["int x = 0, y = 1;", "1"], ["void f(int n) { if (n == 0) return; f(n - 1); }", "n"], ["void f(int n) { if (n <= 1) return; f(n / 2); }", "log n"], ["int[][] m = new int[n][5];", "n"], ["ArrayList<Integer> l = new ArrayList<>(); for (i = 0; i < n; i++) l.add(i);", "n"]]);
    return { q: `Auxiliary space of: \`${c[0]}\``, fields: [fld("S(n)", c[1], "bigo")], solution: [c[0].includes("f(") ? "Recursion: space = maximum depth of the call stack." : "Count memory that grows with n.", `Answer: $O(${D.growthTex(D.growth(c[1]))})$.`] };
  } },
  { id: "g-digits", topic: "recurrence", name: "Calls of sumDigits", make() {
    const n = ri(10, 9999999); const calls = D.digitCalls(n);
    return { q: `How many calls does \`sumDigits(${n})\` make, counting the final call \`sumDigits(0)\`? What does it return?`, fields: [fld("calls", calls, "num"), fld("returns", D.sumDigits(n), "num")], solution: [`Each call strips one digit: ${String(n).length} digits → ${String(n).length} calls + the base case = ${calls}.`, `Sum of digits = ${String(n).split("").join(" + ")} = ${D.sumDigits(n)}.`] };
  } },
  { id: "g-master", topic: "master", name: "Extended Master Theorem", make() {
    let a, b, k, p;
    do { b = pick([2, 2, 3, 4]); k = ri(0, 3); const kase = pick([1, 2, 2, 3]); p = pick([0, 0, 1, 2, -1, -2]);
      if (kase === 2) a = Math.pow(b, k); else if (kase === 1) a = Math.pow(b, k) + ri(1, 5); else a = Math.max(1, Math.pow(b, k) - ri(1, 3)); } while (a < 1 || a > 20 || (k === 0 && p !== 0));
    const r = D.master(a, b, k, p); const f = `${powTex(k)}${p > 0 ? (k ? " " : "") + logTex(p) : p < 0 ? logTex(p) : ""}` || "1";
    return { q: `Solve $T(n) = ${a === 1 ? "" : a}T(n/${b}) + ${p < 0 && !k ? "1" + f : f}$.`, fields: [fld("T(n)", r.ans, "bigo")], solution: [`$a=${a},\\ b=${b},\\ k=${k},\\ p=${p}$; $b^k=${+r.bk.toFixed(3)}$.`, r.why.en, `Case ${r.kase}: $T(n)=${r.tex}$.`] };
  } },
  { id: "g-index", topic: "trees", name: "Array indexing", make() {
    const a = distinct(ri(7, 12), 1, 99).sort((x, y) => y - x); const one = Math.random() < 0.4; const i = ri(1, Math.floor((a.length - 2) / 2));
    const I = one ? i + 1 : i; const l = D.leftIdx(i), p = D.parentIdx(i);
    return { q: `Array $${arr(a)}$ stores a complete binary tree (${one ? "**1-based**" : "**0-based**"} indexing). For the node at index ${I}: give its parent index and left-child index.`, fields: [fld("parent", one ? Math.floor(I / 2) : p, "num"), fld("left", one ? 2 * I : l, "num")],
      solution: [one ? "1-based: parent ⌊i/2⌋, left 2i, right 2i+1." : "0-based: parent ⌊(i−1)/2⌋, left 2i+1, right 2i+2.", `parent = ${one ? Math.floor(I / 2) : p} (value ${a[p]}), left = ${one ? 2 * I : l} (value ${a[l] ?? "—"}).`] };
  } },
  { id: "g-height", topic: "trees", name: "Tree sizes & heights", make() {
    if (Math.random() < 0.5) { const n = ri(5, 300); return { q: `Height (in edges) of a complete binary tree with ${n} nodes?`, fields: [fld("h", Math.floor(Math.log2(n)), "num")], solution: [`$h=\\lfloor\\log_2 ${n}\\rfloor=${Math.floor(Math.log2(n))}$.`] }; }
    const h = ri(1, 7); return { q: `A perfect binary tree has height ${h}. How many nodes and how many leaves?`, fields: [fld("nodes", 2 ** (h + 1) - 1, "num"), fld("leaves", 2 ** h, "num")], solution: [`Nodes $2^{h+1}-1=${2 ** (h + 1) - 1}$, leaves $2^h=${2 ** h}$.`] };
  } },
  { id: "g-heapkind", topic: "heap", name: "Max-heap, min-heap or neither?", make() {
    const n = ri(6, 9); let a = distinct(n, 1, 99); const want = pick(["max", "min", "neither"]);
    if (want !== "neither") a = D.buildHeap(a, want).result; else { a = D.buildHeap(a, "max").result; const i = ri(1, n - 1); const p = D.parentIdx(i); a[i] = a[p] + ri(1, 5); }
    const k = D.heapKind(a);
    return { q: `Is $${arr(a)}$ a max-heap, a min-heap, or neither?`, fields: [fld("kind", k, "text", { alt: [`${k}-heap`, `${k} heap`] })], solution: ["Compare every element with its parent ⌊(i−1)/2⌋.", `Answer: **${k}**.`] };
  } },
  { id: "g-heapins", topic: "heap", name: "Heap insert", make() {
    const type = pick(["max", "max", "min"]); const a = D.buildHeap(distinct(ri(5, 8), 5, 95), type).result; const x = ri(1, 99);
    const r = D.heapInsert(a, x, type);
    return { q: `Insert ${x} into the ${type}-heap $${arr(a)}$. Final array?`, fields: [fld("heap", arr(r.result), "seq")], solution: [`Place ${x} at index ${a.length}.`, ...(swapsText(r.frames).length ? swapsText(r.frames).map((s, k) => `Swap ${k + 1}: $${s}$`) : ["No swap needed."]), `Answer: $${arr(r.result)}$ (${r.swaps} swap${r.swaps === 1 ? "" : "s"}).`] };
  } },
  { id: "g-heapdel", topic: "heap", name: "Delete the root", make() {
    const type = pick(["max", "max", "min"]); const a = D.buildHeap(distinct(ri(6, 9), 5, 95), type).result; const r = D.heapExtract(a, type);
    return { q: `Delete the root from the ${type}-heap $${arr(a)}$. Final array?`, fields: [fld("heap", arr(r.result), "seq")], solution: [`Remove ${a[0]}; move the last element ${a[a.length - 1]} to the root.`, ...swapsText(r.frames).map((s, k) => `Swap ${k + 1}: $${s}$`), `Answer: $${arr(r.result)}$.`] };
  } },
  { id: "g-build", topic: "heap", name: "Build heap (bottom-up)", make() {
    const type = pick(["max", "min"]); const a = distinct(ri(5, 8), 1, 60); const r = D.buildHeap(a, type);
    return { q: `Build a ${type}-heap bottom-up from $${arr(a)}$.`, fields: [fld("heap", arr(r.result), "seq")], solution: [`heapify-down from index ${Math.floor(a.length / 2) - 1} down to 0.`, ...swapsText(r.frames).map((s, k) => `Swap ${k + 1}: $${s}$`), `Answer: $${arr(r.result)}$.`] };
  } },
  { id: "g-heapsort", topic: "heapsort", name: "Heap sort pass", make() {
    const a = distinct(ri(5, 7), 1, 60); const h = D.buildHeap(a, "max").result; const b = [...h]; [b[0], b[b.length - 1]] = [b[b.length - 1], b[0]];
    const after = D.heapExtract(h, "max").result.concat(h[0]);
    return { q: `Heap sort on $${arr(a)}$: give the array after build-heap AND after the first swap-and-heapify step.`, fields: [fld("after build", arr(h), "seq"), fld("after 1 step", arr(after), "seq")], solution: [`Build-heap → $${arr(h)}$.`, `Swap root ${h[0]} with the last element → $${arr(b)}$, then sift down the first ${b.length - 1}.`, `→ $${arr(after)}$.`] };
  } },
  { id: "g-avl", topic: "avl", name: "AVL rotation case", make() {
    const kind = pick(["LL", "RR", "LR", "RL"]); const [x, y, z] = distinct(3, 10, 90).sort((p, q) => p - q);
    const keys = { LL: [z, y, x], RR: [x, y, z], LR: [z, x, y], RL: [x, z, y] }[kind];
    const r = D.avlBuild(keys);
    return { q: `Insert ${keys.join(", ")} into an empty AVL tree. Which rotation case occurs, and which key becomes the root?`, fields: [fld("case", kind, "text"), fld("root", r.tree.k, "num")], solution: [`After the third insert, ${keys[0]} has |bf| = 2.`, `Path from ${keys[0]} to ${keys[2]}: ${kind[0] === "L" ? "left" : "right"} then ${kind[1] === "L" ? "left" : "right"} → **${kind}**.`, `The middle key ${y} becomes the root.`] };
  } },
  { id: "g-avlbuild", topic: "avl", name: "Build an AVL tree", make() {
    const keys = distinct(ri(5, 7), 1, 99); const r = D.avlBuild(keys);
    return { q: `Insert ${keys.join(", ")} (in this order) into an empty AVL tree. Give the pre-order traversal.`, fields: [fld("pre-order", D.preorder(r.tree).join(", "), "seq")], solution: [r.rots.length ? `Rotations: ${r.rots.map((x) => `${x.kind} at ${x.at}`).join(", ")}.` : "No rotations needed.", `Pre-order: ${D.preorder(r.tree).join(", ")}.`] };
  } },
  { id: "g-btree", topic: "btree", name: "B-tree insertion", make() {
    const m = pick([3, 3, 4, 5]); const keys = distinct(ri(6, 9), 1, 99); const r = D.btreeBuild(keys, m);
    return { q: `Insert ${keys.join(", ")} into an empty B-tree of order ${m} (split on overflow, median index ⌈m/2⌉−1). Give the root's keys and the number of splits.`, fields: [fld("root keys", arr(r.tree.keys), "seq"), fld("splits", r.splits, "num")], solution: [`Max keys per node: ${m - 1}.`, `Root: [${r.tree.keys.join(", ")}], height ${D.btreeHeight(r.tree)}, ${r.splits} splits.`] };
  } },
  { id: "g-degree", topic: "graphs", name: "Edges & degrees", make() {
    const V = ri(4, 12); if (Math.random() < 0.5) return { q: `Maximum number of edges in a simple undirected graph with ${V} vertices?`, fields: [fld("|E|", (V * (V - 1)) / 2, "num")], solution: [`$V(V-1)/2=${V}\\cdot${V - 1}/2=${(V * (V - 1)) / 2}$.`] };
    const G = gW(); const deg = Array(6).fill(0); G.edges.forEach((e) => { deg[e.u]++; deg[e.v]++; });
    return { q: `An undirected graph has vertex degrees ${shuffle(deg).join(", ")}. How many edges does it have?`, fields: [fld("|E|", G.edges.length, "num")], solution: [`Handshake lemma: Σdeg = 2|E| → ${deg.reduce((a, b) => a + b)} = 2|E|.`, `|E| = ${G.edges.length}.`] };
  } },
  { id: "g-bfs", topic: "bfsdfs", name: "BFS / DFS order", make() {
    const perm = shuffle([...Array(8).keys()]); const G = { n: 8, directed: false, edges: UEDGES.map(([u, v]) => ({ u: perm[u], v: perm[v] })) };
    const s = ri(0, 7); const which = pick(["BFS", "DFS"]); const r = which === "BFS" ? D.bfs(G, s) : D.dfs(G, s);
    return { q: `Undirected graph with edges ${edgeList(G)}. Give the ${which} order from ${L(s)} (visit neighbours alphabetically).`, fields: [fld("order", r.order.map(L).join(" "), "seq")], solution: [which === "BFS" ? "Use a queue; enqueue unvisited neighbours alphabetically." : "Go to the first unvisited neighbour (alphabetical), backtrack when stuck.", `Order: ${r.order.map(L).join(" → ")}.`] };
  } },
  { id: "g-dijkstra", topic: "shortest", name: "Dijkstra distances", make() {
    const G = gW(); const r = D.dijkstra(G, 0); const t = pick([3, 4, 5]);
    const path = []; for (let v = t; v >= 0; v = r.prev[v]) path.unshift(L(v));
    return { q: `Undirected weighted graph: ${edgeList(G)}. Shortest distance from A to ${L(t)} (Dijkstra)?`, fields: [fld(`d(${L(t)})`, r.dist[t], "num")], solution: [`Final distances: ${r.dist.map((d, k) => `${L(k)}=${d}`).join(", ")}.`, `Path ${path.join("→")} = ${r.dist[t]}.`] };
  } },
  { id: "g-mst", topic: "mst", name: "MST weight", make() {
    const G = gW(); const r = D.kruskal(G);
    return { q: `Undirected weighted graph: ${edgeList(G)}. Weight of a minimum spanning tree?`, fields: [fld("weight", r.total, "num")], solution: ["Kruskal: take edges in increasing weight, skip those forming a cycle.", `Chosen: ${r.tree.map((i) => `${L(G.edges[i].u)}${L(G.edges[i].v)}(${G.edges[i].w})`).join(", ")} → ${r.total}.`] };
  } },
  { id: "g-partition", topic: "dnc", name: "Quick-sort partition", make() {
    const a = distinct(ri(6, 8), 1, 60); const r = D.partitionOnce(a);
    return { q: `Lomuto-partition $${arr(a)}$ around the last element ${a[a.length - 1]}. Give the array afterwards and the pivot's index.`, fields: [fld("array", arr(r.a), "seq"), fld("pivot index", r.pivotIndex, "num")], solution: [`Elements ≤ ${a[a.length - 1]} move to the front in scan order.`, `Pivot lands at index ${r.pivotIndex}: $${arr(r.a)}$.`] };
  } },
  { id: "g-merge", topic: "dnc", name: "Merge two runs", make() {
    const x = distinct(ri(3, 5), 1, 60).sort((a, b) => a - b), y = distinct(ri(3, 5), 61, 99).map((v) => v - ri(0, 60)).sort((a, b) => a - b);
    const m = [...x, ...y].sort((a, b) => a - b);
    return { q: `Merge the sorted runs $${arr(x)}$ and $${arr(y)}$ as merge sort does.`, fields: [fld("merged", arr(m), "seq")], solution: ["Compare the two front elements, output the smaller, advance that run.", `$${arr(m)}$.`] };
  } },
  { id: "g-bsearch", topic: "search-sort", name: "Binary search probes", make() {
    const a = distinct(ri(8, 15), 1, 99).sort((x, y) => x - y); const x = Math.random() < 0.8 ? pick(a) : ri(1, 99); const r = D.binarySearch(a, x);
    return { q: `Binary search for ${x} in $${arr(a)}$ (mid = ⌊(lo+hi)/2⌋). How many elements are compared?`, fields: [fld("probes", r.probes, "num")], solution: [...r.frames.filter((f) => f.mid !== undefined).map((f) => `lo=${f.range[0]}, hi=${f.range[1]}, mid=${f.mid} → ${f.a[f.mid]}`), r.index >= 0 ? `Found at index ${r.index}.` : "Not found."] };
  } },
  { id: "g-activity", topic: "greedy", name: "Activity selection", make() {
    const acts = Array.from({ length: ri(6, 8) }, (_, i) => { const s = ri(0, 12); return { name: `a${i + 1}`, s, f: s + ri(1, 5) }; }); const r = D.activitySelect(acts);
    return { q: `Activities (start, finish): ${acts.map((a) => `${a.name}(${a.s}, ${a.f})`).join(", ")}. Maximum number of non-overlapping activities?`, fields: [fld("count", r.count, "num")], solution: ["Sort by finish time; take each that starts at or after the last finish.", `Chosen: ${r.pick.map((i) => acts[i].name).join(", ")} → ${r.count}.`] };
  } },
  { id: "g-fknap", topic: "greedy", name: "Fractional knapsack", make() {
    const items = Array.from({ length: 3 }, (_, i) => ({ name: `I${i + 1}`, w: ri(2, 9) * 5, v: ri(4, 30) * 5 })); const W = ri(5, 12) * 5; const r = D.fracKnapsack(items, W);
    return { q: `Fractional knapsack, W = ${W}; items (w, v): ${items.map((it) => `(${it.w}, ${it.v})`).join(", ")}. Maximum value? (2 decimals ok)`, fields: [fld("value", +r.value.toFixed(4), "num", { tol: 0.01 })], solution: [`Ratios: ${items.map((it) => (it.v / it.w).toFixed(2)).join(", ")} — take the best first.`, `Value = ${+r.value.toFixed(2)}.`] };
  } },
  { id: "g-huffman", topic: "greedy", name: "Huffman total bits", make() {
    const freq = "abcde".slice(0, ri(4, 5)).split("").map((c) => [c, ri(2, 30)]); const r = D.huffman(freq);
    return { q: `Huffman coding for ${freq.map(([c, f]) => `${c}:${f}`).join(", ")}. Total number of bits needed to encode the text?`, fields: [fld("bits", r.bits, "num")], solution: ["Repeatedly merge the two smallest frequencies.", `Code lengths: ${freq.map(([c]) => `${c}=${r.codes[c].length}`).join(", ")}.`, `Σ f·len = ${r.bits}.`] };
  } },
  { id: "g-fib", topic: "dp-basics", name: "Fibonacci calls", make() {
    const n = ri(3, 9); return { q: `Naive recursive fib(${n}) — how many calls in total? And with memoization (each F(k) computed once, a cached hit still counts as a call)?`, fields: [fld("naive", D.fibCalls(n), "num"), fld("memo", 2 * n - 1, "num")], solution: [`C(n) = 1 + C(n−1) + C(n−2): naive = ${D.fibCalls(n)}.`, `Memoized: n computed + (n−1) cache hits = ${2 * n - 1}.`] };
  } },
  { id: "g-knap01", topic: "dp-apps", name: "0/1 knapsack", make() {
    const items = "ABCD".split("").map((name) => ({ name, w: ri(1, 6), v: ri(1, 12) })); const W = ri(6, 10); const r = D.knapsack01(items, W);
    return { q: `0/1 knapsack, W = ${W}; items (w, v): ${items.map((it) => `${it.name}(${it.w}, ${it.v})`).join(", ")}. Maximum value?`, fields: [fld("value", r.best, "num")], solution: ["$K[i][w]=\\max(K[i-1][w],\\ K[i-1][w-w_i]+v_i)$.", `Best ${r.best} with ${r.chosen.map((i) => items[i].name).join(", ") || "nothing"}.`] };
  } },
  { id: "g-lcs", topic: "dp-apps", name: "LCS length", make() {
    const A = "ABCD"; const s = (n) => Array.from({ length: n }, () => pick(A.split(""))).join(""); const X = s(ri(5, 7)), Y = s(ri(5, 7)); const r = D.lcs(X, Y);
    return { q: `Length of the longest common subsequence of ${X} and ${Y}?`, fields: [fld("length", r.len, "num")], solution: ["Match → diagonal + 1; else max(up, left).", `LCS length ${r.len}, e.g. "${r.str}".`] };
  } },
  { id: "g-mcm", topic: "dp-apps", name: "Matrix-chain cost", make() {
    const dims = Array.from({ length: ri(4, 5) }, () => pick([2, 3, 4, 5, 6, 10, 15, 20])); const r = D.matrixChain(dims);
    return { q: `Matrices with dimensions ${dims.join(" × ").replace(/ × /g, ", ")} (p₀…p${dims.length - 1}). Minimum number of scalar multiplications?`, fields: [fld("cost", r.best, "num")], solution: ["$m[i][j]=\\min_k m[i][k]+m[k+1][j]+p_{i-1}p_kp_j$.", `Minimum ${r.best}, order ${r.order}.`] };
  } },
];

// ---------- extra lessons ----------
GENERATORS.push(
  { id: "g-stack", topic: "stackqueue", name: "Stack trace", make() {
    const ops = []; let n = 0; for (let k = 0; k < ri(6, 9); k++) { if (n && Math.random() < 0.4) { ops.push("pop"); n--; } else { ops.push(`push ${ri(1, 99)}`); n++; } }
    if (!ops.includes("pop")) ops.push("pop");
    const r = D.stackOps(ops);
    return { q: `Run on an empty stack: ${ops.join(", ")}. Which values are popped, in order?`, fields: [fld("popped", r.popped.join(", "), "seq")], solution: ["Each pop removes the current top (LIFO).", `Popped: ${r.popped.join(", ")}; left on the stack (bottom → top): ${r.stack.join(", ") || "nothing"}.`] };
  } },
  { id: "g-cqueue", topic: "stackqueue", name: "Circular queue index", make() {
    const cap = ri(4, 9), front = ri(0, cap - 1), size = ri(1, cap - 1);
    return { q: `Circular queue: capacity ${cap}, front = ${front}, size = ${size}. At which index does the next enqueue go?`, fields: [fld("rear", (front + size) % cap, "num")], solution: [`rear = (front + size) mod cap = (${front} + ${size}) mod ${cap} = ${(front + size) % cap}.`] };
  } },
  { id: "g-llrev", topic: "linkedlist", name: "Linked-list operation", make() {
    const list = distinct(ri(4, 6), 1, 60); const op = pick(["reverse", "delete", "head"]); const x = op === "delete" ? pick(list) : ri(61, 99);
    const r = D.listOp(list, op, x);
    return { q: `List ${list.join(" → ")} → null. ${op === "reverse" ? "Reverse it." : op === "delete" ? `Delete ${x}.` : `Insert ${x} at the head.`} What is the list now?`, fields: [fld("list", r.list.join(" "), "seq")], solution: [op === "reverse" ? "prev/cur/next: point each node back to the previous one." : op === "delete" ? "prev.next = cur.next skips the node." : "node.next = head; head = node.", `${r.list.join(" → ")} → null.`] };
  } },
  { id: "g-hash", topic: "hashing", name: "Hash slot (linear probing)", make() {
    const m = pick([7, 11, 13]); const keys = distinct(ri(4, 6), 1, 120); const r = D.hashInsert(keys, m, "probe"); const k = keys[keys.length - 1];
    return { q: `Linear probing, h(k) = k mod ${m}. Insert ${keys.join(", ")} in order. In which slot does ${k} end up?`, fields: [fld("slot", r.table.indexOf(k), "num")], solution: [`h(${k}) = ${k % m}; walk forward past taken slots.`, `Final table: [${r.table.map((x) => (x === null ? "—" : x)).join(", ")}].`] };
  } },
  { id: "g-trie", topic: "trie", name: "Trie size", make() {
    const pool = ["car", "cat", "cart", "care", "dog", "do", "dot", "tea", "ten", "to", "an", "ant", "and", "bat", "bad"];
    const words = shuffle(pool).slice(0, ri(3, 5)); const r = D.trieBuild(words);
    return { q: `How many nodes (including the root) does a trie need for: ${words.join(", ")}?`, fields: [fld("nodes", r.nodes, "num")], solution: ["Shared prefixes are stored once.", `${r.nodes} nodes.`] };
  } },
  { id: "g-topo", topic: "topo", name: "Topological order", make() {
    const n = ri(5, 6); const perm = shuffle([...Array(n).keys()]); const edges = [];
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (Math.random() < 0.35) edges.push({ u: perm[i], v: perm[j] });
    const G = { n, directed: true, edges }; const r = D.topo(G);
    return { q: `DAG with edges ${edges.map((e) => `${L(e.u)}→${L(e.v)}`).join(", ") || "(none)"} on vertices ${[...Array(n).keys()].map(L).join(", ")}. Topological order, always taking the smallest ready vertex?`, fields: [fld("order", r.order.map(L).join(" "), "seq")], solution: ["Kahn: output an in-degree-0 vertex (smallest first), delete its edges, repeat.", `Order: ${r.order.map(L).join(" → ")}.`] };
  } },
);

export const genById = (id) => GENERATORS.find((g) => g.id === id);
export const gensForTopic = (topic) => GENERATORS.filter((g) => g.topic === topic);
