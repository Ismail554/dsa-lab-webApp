// Growth lab: compare growth rates (1, log n, n, n log n, n², 2ⁿ, n!) and count the steps of real loop patterns.
import { h, L, lang, texHTML } from "../ui.js";
import { segmented, slider, note, toggle } from "./kit.js";
import { vshell, svgBox, S } from "./viz.js";

const CURVES = [
  ["1", (n) => 1, "--c-c"], ["log n", (n) => Math.log2(n), "--c-b"], ["√n", (n) => Math.sqrt(n), "--sky"], ["n", (n) => n, "--c-d"],
  ["n log n", (n) => n * Math.log2(n), "--c-e"], ["n²", (n) => n * n, "--c-a"], ["2ⁿ", (n) => Math.pow(2, n), "--rust"], ["n!", (n) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; }, "--bad"],
];
export const LOOPS = [
  { id: "single", code: "for (i = 0; i < n; i++)\n    count++;", count: (n) => n, big: "n", why: { en: "One pass over n items.", bn: "n টা item এর উপর একবার।" } },
  { id: "nested", code: "for (i = 0; i < n; i++)\n  for (j = 0; j < n; j++)\n    count++;", count: (n) => n * n, big: "n^2", why: { en: "n iterations, each doing n.", bn: "n বার, প্রতিবার আবার n।" } },
  { id: "triangle", code: "for (i = 0; i < n; i++)\n  for (j = 0; j < i; j++)\n    count++;", count: (n) => (n * (n - 1)) / 2, big: "n^2", why: { en: "0+1+…+(n−1) = n(n−1)/2 → still Θ(n²).", bn: "0+1+…+(n−1) = n(n−1)/2 → তবুও Θ(n²)।" } },
  { id: "halving", code: "for (i = n; i > 1; i = i / 2)\n    count++;", count: (n) => { let c = 0; for (let i = n; i > 1; i = Math.floor(i / 2)) c++; return c; }, big: "log n", why: { en: "i halves each time → about log₂ n steps.", bn: "প্রতিবার i অর্ধেক → প্রায় log₂ n ধাপ।" } },
  { id: "doubling", code: "for (i = 1; i < n; i = i * 2)\n    count++;", count: (n) => { let c = 0; for (let i = 1; i < n; i *= 2) c++; return c; }, big: "log n", why: { en: "i doubles each time → ⌈log₂ n⌉ steps.", bn: "প্রতিবার i দ্বিগুণ → ⌈log₂ n⌉ ধাপ।" } },
  { id: "nlogn", code: "for (i = 0; i < n; i++)\n  for (j = 1; j < n; j = j * 2)\n    count++;", count: (n) => { let c = 0; for (let i = 0; i < n; i++) for (let j = 1; j < n; j *= 2) c++; return c; }, big: "n log n", why: { en: "n outer × log n inner.", bn: "বাইরে n × ভিতরে log n।" } },
  { id: "seq", code: "for (i = 0; i < n; i++) count++;\nfor (j = 0; j < n; j++) count++;", count: (n) => 2 * n, big: "n", why: { en: "Two loops one after another add: n + n = 2n → Θ(n).", bn: "পরপর দুটো loop যোগ হয়: n + n = 2n → Θ(n)।" } },
  { id: "sqrt", code: "for (i = 1; i * i <= n; i++)\n    count++;", count: (n) => Math.floor(Math.sqrt(n)), big: "sqrt(n)", why: { en: "Stops when i² > n → √n steps.", bn: "i² > n হলে থামে → √n ধাপ।" } },
];

export default {
  id: "growth", icon: "clock",
  title: { en: "Growth & Step-Counting Lab", bn: "Growth ও Step গণনা ল্যাব" },
  blurb: { en: "Race the growth functions against each other and count the exact steps of common loop patterns — then see why constants and lower-order terms disappear in Big-O.", bn: "Growth function গুলোর দৌড় দেখো আর সাধারণ loop এর আসল step গুনে দেখো — তারপর বোঝো কেন Big-O তে constant আর ছোট পদ বাদ যায়।" },
  topics: ["analysis", "space"],
  mount(host, preset = {}) {
    const bn = lang() === "bn";
    const s = Object.assign({ mode: "race", n: 16, log: false, loop: "halving", on: ["log n", "n", "n log n", "n²", "2ⁿ"] }, preset);
    const ui = vshell(host, preset);
    function draw() {
      const svg = svgBox(640, 340); const N = s.n; const W = 560, H = 280, X0 = 50, Y0 = 300;
      if (s.mode === "race") {
        const act = CURVES.filter((c) => s.on.includes(c[0]));
        const maxV = Math.max(...act.map(([, f]) => f(N)), 2);
        const Y = (v) => (s.log ? Y0 - (H * Math.log10(Math.max(v, 1))) / Math.log10(maxV) : Y0 - (H * v) / maxV);
        svg.append(S("line", { x1: X0, y1: Y0, x2: X0 + W, y2: Y0, class: "t-edge" }), S("line", { x1: X0, y1: Y0, x2: X0, y2: Y0 - H, class: "t-edge" }), S("text", { x: X0 + W, y: Y0 + 18, "text-anchor": "end", class: "ax" }, `n = 1 … ${N}`), S("text", { x: X0 - 6, y: Y0 - H + 4, "text-anchor": "end", class: "ax" }, s.log ? `10^${Math.log10(maxV).toFixed(1)}` : String(+maxV.toPrecision(3))));
        act.forEach(([name, f, col]) => {
          const pts = []; for (let i = 1; i <= 120; i++) { const n = 1 + ((N - 1) * i) / 120; pts.push(`${X0 + (W * (n - 1)) / (N - 1)},${Math.max(Y0 - H - 6, Y(f(n)))}`); }
          svg.append(S("polyline", { points: pts.join(" "), fill: "none", stroke: `var(${col})`, "stroke-width": 2.6 }), S("text", { x: X0 + W + 4, y: Math.max(Y0 - H, Y(f(N))) + 4, fill: `var(${col})`, class: "lbl" }, name));
        });
        ui.msgBar.replaceChildren(bn ? `n = ${N} এ: ` : `At n = ${N}: `, ...CURVES.filter((c) => s.on.includes(c[0])).map(([name, f]) => h("span.pill.small", `${name} = ${fmtN(f(N))}`)));
      } else {
        const lp = LOOPS.find((l) => l.id === s.loop); const ns = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024].filter((x) => x <= Math.max(s.n * 16, 64));
        const maxV = Math.max(...ns.map(lp.count), 1);
        ns.forEach((n, i) => { const bw = W / ns.length; const hh = (H * lp.count(n)) / maxV; svg.append(S("g", { class: "bar" }, S("rect", { x: X0 + i * bw + 4, y: Y0 - hh, width: bw - 8, height: Math.max(1, hh), rx: 4 }), S("text", { x: X0 + i * bw + bw / 2, y: Y0 - hh - 5, "text-anchor": "middle" }, fmtN(lp.count(n))), S("text", { class: "bar-i", x: X0 + i * bw + bw / 2, y: Y0 + 16, "text-anchor": "middle" }, `n=${n}`))); });
        ui.msgBar.replaceChildren(h("span", { html: `${bn ? "n দ্বিগুণ হলে count কত গুণ হয়? " : "When n doubles, how does count change? "}${texHTML(`\\Rightarrow \\Theta(${lp.big.replace("sqrt(n)", "\\sqrt n").replace("log n", "\\log n").replace("n^2", "n^2")})`)} — ${L(lp.why)}` }));
      }
      ui.view.replaceChildren(svg); ui.bar.replaceChildren(); info();
    }
    const fmtN = (v) => (v >= 1e6 ? v.toExponential(2) : String(+v.toFixed(2)));
    const box = h("div.lab-controls");
    const modeSeg = segmented([{ value: "race", label: { en: "growth race", bn: "growth race" } }, { value: "loops", label: { en: "count loop steps", bn: "loop step গণনা" } }], s.mode, (v) => { s.mode = v; controls(); draw(); });
    ui.controls.append(modeSeg, box);
    function controls() {
      if (s.mode === "race") box.replaceChildren(slider({ label: "n", min: 4, max: 40, step: 1, value: s.n, onInput: (v) => { s.n = v; draw(); } }), toggle({ en: "log scale", bn: "log scale" }, s.log, (v) => { s.log = v; draw(); }),
        h("div.chip-row", CURVES.map(([name]) => h("button.chip", { class: s.on.includes(name) ? "on" : "", onclick: (e) => { s.on = s.on.includes(name) ? s.on.filter((x) => x !== name) : [...s.on, name]; e.currentTarget.classList.toggle("on"); draw(); } }, name))));
      else box.replaceChildren(segmented(LOOPS.map((l) => ({ value: l.id, label: l.id })), s.loop, (v) => { s.loop = v; draw(); }));
    }
    function info() {
      if (s.mode === "loops") { const lp = LOOPS.find((l) => l.id === s.loop); ui.info.replaceChildren(h("pre.code", lp.code), note(bn ? "Count বের করো, তারপর সবচেয়ে বড় পদ রেখে constant বাদ দাও: 3n² + 5n + 2 → Θ(n²)।" : "Find the count, keep the fastest-growing term and drop constants: 3n² + 5n + 2 → Θ(n²).")); return; }
      ui.info.replaceChildren(
        h("div.mathblock", { html: texHTML("1<\\log n<\\sqrt n<n<n\\log n<n^2<2^n<n!", true) }),
        note(bn ? "<b>O</b> = upper bound (এর চেয়ে দ্রুত বাড়ে না), <b>Ω</b> = lower bound, <b>Θ</b> = দুটোই (tight)। f(n)=O(g(n)) মানে এমন C>0, n₀ আছে যে সব n ≥ n₀ এ f(n) ≤ C·g(n)।" : "<b>O</b> = upper bound (grows no faster), <b>Ω</b> = lower bound, <b>Θ</b> = both (tight). f(n)=O(g(n)) means there exist C>0 and n₀ with f(n) ≤ C·g(n) for all n ≥ n₀."),
        note(bn ? "Log scale চালু করে দেখো: 2ⁿ আর n! বাকি সবাইকে ছাড়িয়ে যায় — n = 40 এ 2ⁿ ≈ 10¹²।" : "Turn on log scale: 2ⁿ and n! leave everything behind — at n = 40, 2ⁿ ≈ 10¹²."));
    }
    controls(); draw();
    return { set(p) { Object.assign(s, p); modeSeg.set(s.mode); controls(); draw(); }, destroy() {} };
  },
};
