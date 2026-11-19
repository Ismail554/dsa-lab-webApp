// Dynamic-programming lab: Fibonacci (recursion vs memo vs table), 0/1 knapsack, LCS, matrix-chain multiplication.
import { h, lang, texHTML } from "../ui.js";
import { segmented, note, button, slider } from "./kit.js";
import { vshell, player, svgBox, S, layoutBinary, drawBinary, dpTable, inputRow, parseNums } from "./viz.js";
import { knapsack01, lcs, matrixChain, fibCalls, fibTab, ri, pick } from "../dsa.js";

export const KITEMS = [{ name: "A", w: 1, v: 1 }, { name: "B", w: 3, v: 4 }, { name: "C", w: 4, v: 5 }, { name: "D", w: 5, v: 7 }];

function fibFrames(n, memo) {
  const F = []; const seen = new Map(); let id = 0;
  const build = (k) => {
    const node = { k, id: id++, l: null, r: null, hit: false };
    if (memo && seen.has(k)) { node.hit = true; return node; }
    if (k >= 2) { node.l = build(k - 1); node.r = build(k - 2); }
    seen.set(k, true); return node;
  };
  const root = build(n); let calls = 0; const order = [];
  const walk = (t) => { if (!t) return; calls++; order.push(t.id); walk(t.l); walk(t.r); }; walk(root);
  order.forEach((_, i) => F.push({ tree: root, upto: new Set(order.slice(0, i + 1)), calls: i + 1, msg: { en: `${i + 1} call${i ? "s" : ""} so far${memo ? " (memo hits are leaves)" : ""}.`, bn: `এ পর্যন্ত ${i + 1} টা call${memo ? " (memo hit গুলো leaf)" : ""}।` } }));
  F.push({ tree: root, upto: new Set(order), calls, done: true, msg: { en: `fib(${n}) = ${fibTab(n)[n]} using ${calls} calls${memo ? " — each subproblem solved once: O(n)" : " — exponential, ≈ φⁿ"}.`, bn: `fib(${n}) = ${fibTab(n)[n]}, মোট ${calls} টা call${memo ? " — প্রতিটা subproblem একবার: O(n)" : " — exponential, ≈ φⁿ"}।` } });
  return F;
}

export default {
  id: "dp", icon: "cards",
  title: { en: "Dynamic Programming Lab", bn: "Dynamic Programming ল্যাব" },
  blurb: { en: "Overlapping subproblems + optimal substructure. Watch naive recursion explode, memoization prune it, and tables for 0/1 knapsack, LCS and matrix-chain fill cell by cell.", bn: "Overlapping subproblem + optimal substructure। দেখো সাধারণ recursion কীভাবে বিস্ফোরিত হয়, memoization কেটে ছোট করে, আর 0/1 knapsack, LCS, matrix-chain এর table ঘর ঘর ভরে।" },
  topics: ["dp-basics", "dp-apps"],
  mount(host, preset = {}) {
    const bn = lang() === "bn";
    const s = Object.assign({ mode: "fib", n: 6, memo: false, items: KITEMS, W: 7, X: "ABCBDAB", Y: "BDCABA", dims: [10, 30, 5, 60] }, preset);
    const ui = vshell(host, preset);
    const draw = (f) => {
      if (s.mode === "fib") {
        const svg = svgBox(640, 340);
        drawBinary(svg, layoutBinary(f.tree), { W: 640, H: 340, r: 14, label: (t) => t.k, cls: (t) => [f.upto.has(t.id) ? "ok" : "ghost", t.hit ? "hit" : ""].join(" ") });
        ui.view.replaceChildren(svg, h("div.arr", fibTab(s.n).map((v, i) => h("div.arr-cell.ok", h("span.arr-v", String(v)), h("small.arr-i", `F${i}`)))));
      } else if (s.mode === "knapsack") {
        ui.view.replaceChildren(h("div.dp-wrap", dpTable(f.T, { rowHead: ["0", ...s.items.map((it) => `${it.name} (w${it.w},v${it.v})`)], colHead: Array.from({ length: s.W + 1 }, (_, i) => i), cell: f.cell, from: f.from || [], path: f.done ? pathOfKnap(f.T) : [] })));
      } else if (s.mode === "lcs") {
        ui.view.replaceChildren(h("div.dp-wrap", dpTable(f.T, { rowHead: ["∅", ...s.X], colHead: ["∅", ...s.Y], cell: f.cell, from: f.from || [], path: f.path || [] })));
      } else {
        const n = s.dims.length - 1;
        ui.view.replaceChildren(h("div.dp-wrap", dpTable(f.T.slice(1).map((r) => r.slice(1)), { rowHead: Array.from({ length: n }, (_, i) => `i=${i + 1}`), colHead: Array.from({ length: n }, (_, j) => `j=${j + 1}`), cell: f.cell && [f.cell[0] - 1, f.cell[1] - 1], from: (f.from || []).map(([a, b]) => [a - 1, b - 1]) })));
      }
      info(f);
    };
    const pathOfKnap = (T) => { const out = []; let w = s.W; for (let i = s.items.length; i > 0; i--) { out.push([i, w]); if (T[i][w] !== T[i - 1][w]) w -= s.items[i - 1].w; } return out; };
    const P = player(ui, draw);
    function run() {
      if (s.mode === "fib") P.load(fibFrames(s.n, s.memo), "end");
      else if (s.mode === "knapsack") P.load(knapsack01(s.items, s.W).frames);
      else if (s.mode === "lcs") P.load(lcs(s.X, s.Y).frames);
      else P.load(matrixChain(s.dims).frames);
      controls();
    }
    const seg = segmented([["fib", "Fibonacci"], ["knapsack", "0/1 knapsack"], ["lcs", "LCS"], ["mcm", "matrix chain"]].map(([value, label]) => ({ value, label })), s.mode, (v) => { s.mode = v; run(); });
    const extra = h("div.lab-controls");
    ui.controls.append(seg, extra);
    function controls() {
      if (s.mode === "fib") extra.replaceChildren(slider({ label: "n", min: 2, max: 8, step: 1, value: s.n, onInput: (v) => { s.n = v; run(); } }), segmented([{ value: false, label: { en: "plain recursion", bn: "সাধারণ recursion" } }, { value: true, label: "memoization" }], s.memo, (v) => { s.memo = v; run(); }));
      else if (s.mode === "knapsack") extra.replaceChildren(inputRow("W", s.W, "Set W", (v) => { const x = parseNums(v)[0]; if (x > 0 && x <= 15) { s.W = x; run(); } }), button(bn ? "এলোমেলো item" : "Random items", () => { s.items = "ABCD".split("").map((name) => ({ name, w: ri(1, 6), v: ri(1, 12) })); s.W = ri(6, 10); run(); }, "small"));
      else if (s.mode === "lcs") extra.replaceChildren(inputRow("X", s.X, "X", (v) => { if (v.trim()) { s.X = v.trim().toUpperCase().slice(0, 10); run(); } }), inputRow("Y", s.Y, "Y", (v) => { if (v.trim()) { s.Y = v.trim().toUpperCase().slice(0, 10); run(); } }));
      else extra.replaceChildren(inputRow(bn ? "মাত্রা p0 p1 … pn" : "dimensions p0 p1 … pn", s.dims.join(", "), "Set", (v) => { const d = parseNums(v, 7); if (d.length >= 3) { s.dims = d; run(); } }), button(bn ? "এলোমেলো" : "Random", () => { s.dims = Array.from({ length: ri(4, 6) }, () => pick([5, 10, 15, 20, 25, 30, 35, 40])); run(); }, "small"));
    }
    function info(f) {
      const rec = { fib: "F(n)=F(n-1)+F(n-2)", knapsack: "T[i][w]=\\max(T[i-1][w],\\ T[i-1][w-w_i]+v_i)", lcs: "c[i][j]=\\begin{cases}c[i-1][j-1]+1 & x_i=y_j\\\\ \\max(c[i-1][j],c[i][j-1]) & \\text{else}\\end{cases}", mcm: "m[i][j]=\\min_{i\\le k<j} m[i][k]+m[k+1][j]+p_{i-1}p_kp_j" }[s.mode];
      const tip = {
        fib: bn ? `সাধারণ recursion এ fib(${s.n}) এর জন্য ${fibCalls(s.n)} টা call; memo দিলে প্রতিটা F(k) একবারই গণনা হয় (${2 * s.n - 1} call)। Tabulation (bottom-up) নিচের array টা বাম থেকে ডানে ভরে: O(n) সময়, চাইলে O(1) জায়গা।` : `Plain recursion makes ${fibCalls(s.n)} calls for fib(${s.n}); memoization computes each F(k) once (${2 * s.n - 1} calls). Tabulation (bottom-up) fills the array below left to right: O(n) time, O(1) space if you keep two values.`,
        knapsack: bn ? "প্রতিটা ঘর: item i নেব কি নেব না? O(nW) সময় — W এর উপর নির্ভর করে (pseudo-polynomial)।" : "Each cell answers: take item i or not? O(nW) time — pseudo-polynomial in W.",
        lcs: bn ? "মিল হলে কোণাকুণি +1, না হলে উপর/বামের max। O(mn) সময়। সবুজ পথ ধরে পিছনে গেলে LCS পাওয়া যায়।" : "Match → diagonal + 1; otherwise max of up/left. O(mn). Trace the highlighted path back to read an LCS.",
        mcm: bn ? `Chain length অনুযায়ী (কোণাকুণি) ভরো। O(n³)। A_i এর মাত্রা p_{i-1}×p_i।` : "Fill by chain length (diagonal by diagonal). O(n³). Matrix A_i is p_{i-1}×p_i.",
      }[s.mode];
      ui.info.replaceChildren(h("div.mathblock", { html: texHTML(rec, true) }), note(tip),
        note(bn ? "<b>DP কখন?</b> (১) Optimal substructure — বড় সমাধান ছোট সমাধান দিয়ে তৈরি; (২) Overlapping subproblems — একই ছোট সমস্যা বারবার আসে। Divide & conquer এ subproblem আলাদা থাকে, তাই সেখানে memo লাগে না।" : "<b>When DP?</b> (1) optimal substructure — the best answer is built from best sub-answers; (2) overlapping subproblems — the same small problem recurs. Divide & conquer has disjoint subproblems, so no memo is needed."));
    }
    run();
    return { set(p) { Object.assign(s, p); seg.set(s.mode); run(); }, destroy() { P.destroy(); } };
  },
};
