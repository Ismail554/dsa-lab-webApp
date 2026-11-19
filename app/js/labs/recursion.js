// Recursion lab: (1) recursion tree for T(n)=aT(n/b)+n^k log^p n with level work → Extended Master Theorem case,
// (2) call stack of a recursive function (space = maximum stack depth).
import { h, L, lang, texHTML } from "../ui.js";
import { segmented, slider, note, button } from "./kit.js";
import { vshell, player, svgBox, S } from "./viz.js";
import { master } from "../dsa.js";

const FUNCS = {
  digits: { name: "sumDigits(n)", tex: "T(n)=T(\\lfloor n/10\\rfloor)+c=\\Theta(\\log n)", code: "if (n == 0) return 0;\nreturn n % 10 + sumDigits(n / 10);", arg: 4372, next: (n) => (n === 0 ? null : Math.floor(n / 10)), ret: (n, r) => (n === 0 ? 0 : (n % 10) + r) },
  fact: { name: "factorial(n)", tex: "T(n)=T(n-1)+c=\\Theta(n)", code: "if (n <= 1) return 1;\nreturn n * factorial(n - 1);", arg: 6, next: (n) => (n <= 1 ? null : n - 1), ret: (n, r) => (n <= 1 ? 1 : n * r) },
  print: { name: "print(n)", tex: "T(n)=T(n-1)+c,\\ S(n)=\\Theta(n)", code: "if (n == 0) return;\nprint(n - 1);", arg: 7, next: (n) => (n === 0 ? null : n - 1), ret: () => "·" },
  bsearch: { name: "binarySearch(lo, hi)", tex: "T(n)=T(n/2)+c=\\Theta(\\log n)", code: "mid = (lo + hi) / 2;\nif (a[mid] == x) return mid;\nrecurse on one half", arg: 64, next: (n) => (n <= 1 ? null : Math.floor(n / 2)), ret: () => "✓" },
};

function stackFrames(fn, arg) {
  const F = []; const chain = []; let x = arg;
  while (x !== null) { chain.push(x); F.push({ stack: [...chain], phase: "call", msg: { en: `Call ${fn.name.replace(/\(.*/, "")}(${x}) — push a new stack frame (depth ${chain.length}).`, bn: `${fn.name.replace(/\(.*/, "")}(${x}) call — নতুন stack frame push (depth ${chain.length})।` } }); x = fn.next(x); }
  let r = null; const depth = chain.length;
  for (let i = chain.length - 1; i >= 0; i--) { r = fn.ret(chain[i], r); const shown = [...chain.slice(0, i + 1)]; F.push({ stack: shown, ret: r, phase: "ret", msg: { en: `Frame (${chain[i]}) returns ${r} and is popped.`, bn: `Frame (${chain[i]}) ${r} return করে pop হয়।` } }); }
  F.push({ stack: [], done: true, depth, msg: { en: `Done. Maximum stack depth = ${depth} → auxiliary space Θ(depth).`, bn: `শেষ। সর্বোচ্চ stack depth = ${depth} → auxiliary space Θ(depth)।` } });
  return { F, depth };
}

export default {
  id: "recursion", icon: "repeat",
  title: { en: "Recursion Tree & Master Theorem Lab", bn: "Recursion Tree ও Master Theorem ল্যাব" },
  blurb: { en: "Set a, b, k, p and see the recursion tree: how many nodes per level, how much work per level, and which level dominates — that is the Master Theorem case. Plus a live call stack.", bn: "a, b, k, p ঠিক করো আর recursion tree দেখো: প্রতি level এ কতগুলো node, কত কাজ, আর কোন level dominate করে — সেটাই Master Theorem এর case। সাথে live call stack।" },
  topics: ["master", "recurrence", "space"],
  mount(host, preset = {}) {
    const bn = lang() === "bn";
    const s = Object.assign({ mode: "tree", a: 2, b: 2, k: 1, p: 0, fn: "digits" }, preset);
    const ui = vshell(host, preset);
    let P = null;
    function drawTree() {
      const { a, b, k, p } = s; const n = 4096; const levels = Math.min(6, Math.max(2, Math.floor(Math.log(n) / Math.log(b))));
      const svg = svgBox(640, 340); const work = [];
      for (let i = 0; i <= levels; i++) { const size = n / Math.pow(b, i); const nodes = Math.pow(a, i); work.push(nodes * Math.pow(size, k) * Math.pow(Math.max(Math.log2(size), 1), p)); }
      const maxW = Math.max(...work);
      for (let i = 0; i <= levels; i++) {
        const y = 22 + i * (300 / (levels + 1)); const shown = Math.min(Math.pow(a, i), 32); const x0 = 30, x1 = 370; const step = (x1 - x0) / shown;
        for (let j = 0; j < shown; j++) svg.append(S("circle", { cx: x0 + step * (j + 0.5), cy: y, r: Math.max(2.5, Math.min(11, step / 2.6)), class: "rt-node" }));
        if (Math.pow(a, i) > 32) svg.append(S("text", { x: x1 + 4, y: y + 4, class: "ax" }, "…"));
        svg.append(S("text", { x: 4, y: y + 4, class: "ax" }, `L${i}`));
        const bw = (240 * work[i]) / maxW; svg.append(S("rect", { x: 390, y: y - 9, width: Math.max(2, bw), height: 18, rx: 4, class: `rt-bar ${work[i] === maxW ? "max" : ""}` }), S("text", { x: 394 + Math.max(2, bw), y: y + 4, class: "ax" }, `${+(work[i] / work[0]).toPrecision(3)}×`));
      }
      svg.append(S("text", { x: 30, y: 336, class: "ax" }, bn ? `প্রতি level এ node: a^i = ${a}^i, আকার n/${b}^i` : `nodes per level a^i = ${a}^i, size n/${b}^i`), S("text", { x: 390, y: 336, class: "ax" }, bn ? "level এর মোট কাজ (root এর তুলনায়)" : "work per level (× root)"));
      ui.view.replaceChildren(svg);
      const r = master(a, b, k, p);
      ui.msgBar.replaceChildren(h("span", { html: `${texHTML(`T(n)=${a}T(n/${b})+${k ? (k === 1 ? "n" : `n^{${k}}`) : ""}${p ? (p === 1 ? "\\log n" : `\\log^{${p}} n`) : k ? "" : "1"}`)} &nbsp;⇒&nbsp; <b>Case ${r.kase}</b>: ${texHTML(r.tex)} — ${L(r.why)}` }));
      ui.bar.replaceChildren();
      ui.info.replaceChildren(
        h("div.kv", h("div", h("b", "a "), String(a)), h("div", h("b", "b^k "), String(+r.bk.toFixed(3))), h("div", h("b", "log_b a "), String(+r.L.toFixed(3)))),
        h("table.dp.small", h("tr", h("th", "case"), h("th", bn ? "শর্ত" : "condition"), h("th", "T(n)")),
          [["1", "a > b^k", "\\Theta(n^{\\log_b a})"], ["2.1", "a=b^k,\\ p>-1", "\\Theta(n^k\\log^{p+1}n)"], ["2.2", "a=b^k,\\ p=-1", "\\Theta(n^k\\log\\log n)"], ["2.3", "a=b^k,\\ p<-1", "\\Theta(n^k)"], ["3", "a<b^k", "\\Theta(n^k\\log^p n)"]].map(([c, cond, res]) => h("tr", { class: c === r.kase ? "on" : "" }, h("td", c), h("td", { html: texHTML(cond) }), h("td", { html: texHTML(res) })))),
        note(bn ? "বার গুলো দেখো: নিচের দিকে বাড়লে leaf dominate (Case 1), সমান থাকলে প্রতিটা level সমান (Case 2 → log গুণ হয়), কমলে root dominate (Case 3)।" : "Read the bars: growing downward → leaves dominate (Case 1); all equal → every level costs the same (Case 2, multiply by the number of levels ≈ log n); shrinking → the root dominates (Case 3)."));
    }
    function runStack() {
      const fn = FUNCS[s.fn]; const { F, depth } = stackFrames(fn, fn.arg);
      if (!P) P = player(ui, (f) => {
        const svg = svgBox(640, 340); const st = f.stack; const hh = Math.min(34, 300 / Math.max(1, st.length + 1));
        st.forEach((x, i) => svg.append(S("g", { class: `frame ${i === st.length - 1 ? "top" : ""}` }, S("rect", { x: 180, y: 320 - (i + 1) * hh, width: 280, height: hh - 4, rx: 6 }), S("text", { x: 320, y: 320 - (i + 1) * hh + hh / 2 - 2, "text-anchor": "middle", dy: "0.35em" }, `${FUNCS[s.fn].name.replace(/\(.*/, "")}(${x})${i === st.length - 1 && f.phase === "ret" ? ` → ${f.ret}` : ""}`))));
        svg.append(S("line", { x1: 160, y1: 320, x2: 480, y2: 320, class: "t-edge" }), S("text", { x: 320, y: 336, "text-anchor": "middle", class: "ax" }, bn ? "call stack (নিচে main)" : "call stack (main at the bottom)"));
        ui.view.replaceChildren(svg);
      });
      P.load(F);
      ui.info.replaceChildren(h("pre.code", fn.code), h("div.mathblock", { html: texHTML(fn.tex, true) }), h("div.kv", h("div", h("b", bn ? "সর্বোচ্চ depth " : "max depth "), String(depth))),
        note(bn ? "প্রতিটা recursive call stack এ একটা frame রাখে (parameter, local variable, return address)। তাই recursion এর space = সর্বোচ্চ depth × প্রতি frame এর জায়গা।" : "Every recursive call keeps a frame on the stack (parameters, locals, return address). So recursion space = maximum depth × frame size."));
    }
    const modeSeg = segmented([{ value: "tree", label: { en: "recursion tree", bn: "recursion tree" } }, { value: "stack", label: { en: "call stack", bn: "call stack" } }], s.mode, (v) => { s.mode = v; render(); });
    const box = h("div.lab-controls");
    ui.controls.append(modeSeg, box);
    function render() {
      if (s.mode === "tree") {
        if (P) { P.destroy(); P = null; }
        box.replaceChildren(
          slider({ label: "a", min: 1, max: 9, step: 1, value: s.a, onInput: (v) => { s.a = v; drawTree(); } }),
          slider({ label: "b", min: 2, max: 4, step: 1, value: s.b, onInput: (v) => { s.b = v; drawTree(); } }),
          slider({ label: "k", min: 0, max: 3, step: 1, value: s.k, onInput: (v) => { s.k = v; drawTree(); } }),
          slider({ label: "p", min: -2, max: 3, step: 1, value: s.p, onInput: (v) => { s.p = v; drawTree(); } }),
          h("div.row", [["merge sort", 2, 2, 1, 0], ["binary search", 1, 2, 0, 0], ["Strassen-like", 7, 2, 2, 0], ["2T(n/2)+n/log n", 2, 2, 1, -1]].map(([l, a, b, k, p]) => button(l, () => { Object.assign(s, { a, b, k, p }); render(); }, "small"))));
        drawTree();
      } else {
        box.replaceChildren(segmented(Object.entries(FUNCS).map(([value, f]) => ({ value, label: f.name })), s.fn, (v) => { s.fn = v; runStack(); }));
        runStack();
      }
    }
    render();
    return { set(p) { Object.assign(s, p); modeSeg.set(s.mode); render(); }, destroy() { P && P.destroy(); } };
  },
};
