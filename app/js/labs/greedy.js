// Greedy lab: activity selection (timeline), fractional knapsack (ratio bars), Huffman coding (forest → tree).
import { h, lang } from "../ui.js";
import { segmented, note, button } from "./kit.js";
import { vshell, player, svgBox, S, layoutBinary, drawBinary, isoRect } from "./viz.js";
import { activitySelect, fracKnapsack, huffman, ri } from "../dsa.js";

export const ACTS = [["a1", 1, 4], ["a2", 3, 5], ["a3", 0, 6], ["a4", 5, 7], ["a5", 3, 9], ["a6", 5, 9], ["a7", 6, 10], ["a8", 8, 11], ["a9", 8, 12], ["a10", 2, 14], ["a11", 12, 16]].map(([name, s, f]) => ({ name, s, f }));
export const ITEMS = [{ name: "I1", w: 10, v: 60 }, { name: "I2", w: 20, v: 100 }, { name: "I3", w: 30, v: 120 }];
export const FREQ = [["a", 45], ["b", 13], ["c", 12], ["d", 16], ["e", 9], ["f", 5]];

export default {
  id: "greedy", icon: "spark",
  title: { en: "Greedy Algorithms Lab", bn: "Greedy Algorithm ল্যাব" },
  blurb: { en: "Make the locally best choice and never look back: pick activities by earliest finish, fill a knapsack by value per kg, and build a Huffman tree from the two rarest symbols.", bn: "প্রতি ধাপে সেরা স্থানীয় সিদ্ধান্ত, পিছনে না তাকিয়ে: সবচেয়ে আগে শেষ হওয়া activity নাও, প্রতি kg value দেখে knapsack ভরো, আর সবচেয়ে কম frequency এর দুটো জুড়ে Huffman tree বানাও।" },
  topics: ["greedy"],
  mount(host, preset = {}) {
    const bn = lang() === "bn";
    const s = Object.assign({ mode: "activity", acts: ACTS, items: ITEMS, W: 50, freq: FREQ }, preset);
    const ui = vshell(host, preset);
    const draw = (f) => {
      const svg = svgBox(640, 340);
      if (s.mode === "activity") {
        const maxT = Math.max(...s.acts.map((a) => a.f)) + 1; const X = (t) => 60 + (t * 560) / maxT; const rowH = Math.min(28, 290 / f.order.length);
        for (let t = 0; t <= maxT; t++) svg.append(S("text", { x: X(t), y: 330, class: "ax", "text-anchor": "middle" }, String(t)), S("line", { x1: X(t), y1: 10, x2: X(t), y2: 316, class: "grid" }));
        f.order.forEach((a, r) => { const picked = f.pick.includes(a.i); const cls = picked ? "ok" : f.cur === a.i ? (f.ok ? "ok" : "bad") : f.pick.length && r < f.order.findIndex((x) => x.i === f.cur) && !picked ? "dim" : "";
          svg.append(S("g", { class: `act ${cls} ${f.cur === a.i ? "cur" : ""}` }, S("text", { x: 52, y: 14 + r * rowH + rowH / 2, "text-anchor": "end", dy: "0.35em" }, a.name), isoRect({ x: X(a.s), y: 14 + r * rowH + 6, width: X(a.f) - X(a.s), height: rowH - 9 }, 5), S("text", { x: (X(a.s) + X(a.f)) / 2, y: 14 + r * rowH + rowH / 2, "text-anchor": "middle", dy: "0.35em", class: "in" }, `${a.s}–${a.f}`))); });
      } else if (s.mode === "knapsack") {
        const tot = s.W; const X = (w) => 40 + (w * 560) / tot; let x = 0;
        svg.append(S("rect", { x: 40, y: 250, width: 560, height: 46, rx: 8, class: "sack" }), S("text", { x: 320, y: 318, "text-anchor": "middle", class: "ax" }, `${bn ? "ক্ষমতা" : "capacity"} W = ${tot}`));
        f.order.forEach((it, r) => {
          const t = f.take[it.i]; const y = 20 + r * 64;
          svg.append(S("g", { class: `item ${f.cur === it.i ? "cur" : ""} ${t ? "ok" : ""}` }, isoRect({ x: 40, y: y + 4, width: Math.min(560, (it.w * 560) / tot), height: 36 }, 7), S("text", { x: 48, y: y + 20, dy: "0.35em" }, `${it.name}: w=${it.w}, v=${it.v}, v/w=${+it.r.toFixed(2)}${t ? ` → ${t === 1 ? "100%" : +(t * 100).toFixed(1) + "%"}` : ""}`)));
          if (t) { svg.append(isoRect({ x: X(x), y: 250, width: X(x + t * it.w) - X(x), height: 46, class: `fill f${r % 3}` }, 8), S("text", { x: (X(x) + X(x + t * it.w)) / 2, y: 273, dy: "0.35em", "text-anchor": "middle", class: "in" }, it.name)); x += t * it.w; }
        });
      } else {
        const forest = f.forest; let ox = 0; const total = forest.reduce((a, t) => a + Math.max(1, layoutBinary(t).width), 0);
        forest.forEach((t) => {
          const lay = layoutBinary(t); const w = (Math.max(1, lay.width) / total) * 640;
          const g = S("g", { transform: `translate(${ox},0)` }); svg.append(g);
          drawBinary(g, lay, { W: w, H: 330, r: 17, label: (n) => (n.ch !== undefined ? `${n.ch}:${n.f}` : n.f), cls: (n) => [n.ch !== undefined ? "leaf" : "", n.id === f.hl ? "hl" : ""].join(" ") });
          ox += w;
        });
      }
      ui.view.replaceChildren(svg); info(f);
    };
    const P = player(ui, draw, { state: (f) => {
      const bn = lang() === "bn";
      if (s.mode === "activity") return [{ label: bn ? "নেওয়া হয়েছে" : "Chosen", items: (f.pick || []).map((i) => s.acts[i].name), tone: "ok" }, { label: bn ? "শেষ finish" : "Last finish", items: [f.pick && f.pick.length ? s.acts[f.pick[f.pick.length - 1]].f : "−∞"] }];
      if (s.mode === "knapsack") return [{ label: "value", items: [+f.value.toFixed(2)], tone: "ok" }, { label: bn ? "বাকি capacity" : "Capacity left", items: [+f.cap.toFixed(2)], tone: "hot" }];
      return [{ label: "Queue (freq)", items: f.forest.map((t) => (t.ch !== undefined ? `${t.ch}:${t.f}` : t.f)), tone: "hot" }, f.bits !== undefined ? { label: bn ? "মোট bit" : "Total bits", items: [f.bits], tone: "ok" } : null];
    } });
    function run() { P.load(s.mode === "activity" ? activitySelect(s.acts).frames : s.mode === "knapsack" ? fracKnapsack(s.items, s.W).frames : huffman(s.freq).frames, 0, s.mode === "activity" ? "activity" : s.mode === "knapsack" ? "fknap" : "huffman"); }
    const seg = segmented([["activity", "activity selection"], ["knapsack", "fractional knapsack"], ["huffman", "Huffman coding"]].map(([value, label]) => ({ value, label })), s.mode, (v) => { s.mode = v; run(); });
    ui.controls.append(seg, h("div.row", button(bn ? "নতুন এলোমেলো উদাহরণ" : "New random example", () => {
      if (s.mode === "activity") s.acts = Array.from({ length: ri(6, 9) }, (_, i) => { const st = ri(0, 10); return { name: `a${i + 1}`, s: st, f: st + ri(1, 5) }; });
      else if (s.mode === "knapsack") { s.items = Array.from({ length: 4 }, (_, i) => ({ name: `I${i + 1}`, w: ri(5, 30), v: ri(10, 120) })); s.W = ri(30, 60); }
      else s.freq = "abcdef".split("").map((c) => [c, ri(2, 40)]);
      run();
    }, "small"), button(bn ? "পাঠ্যবইয়ের উদাহরণ" : "Textbook example", () => { s.acts = ACTS; s.items = ITEMS; s.W = 50; s.freq = FREQ; run(); }, "small")));
    function info(f) {
      const parts = [];
      if (s.mode === "huffman" && f.codes) parts.push(h("table.dp.small", h("tr", h("th", bn ? "অক্ষর" : "char"), h("th", "freq"), h("th", "code"), h("th", "bits")), s.freq.map(([c, fr]) => h("tr", h("td", c), h("td", String(fr)), h("td", h("code", f.codes[c])), h("td", String(fr * f.codes[c].length))))), h("p", h("b", `Σ = ${f.bits} bits`), bn ? ` (fixed 3-bit code হলে ${3 * s.freq.reduce((a, x) => a + x[1], 0)})` : ` (vs ${3 * s.freq.reduce((a, x) => a + x[1], 0)} with a fixed 3-bit code)`));
      const tips = {
        activity: bn ? "Greedy choice: সবচেয়ে আগে <b>শেষ</b> হওয়া activity — এতে বাকিদের জন্য সবচেয়ে বেশি সময় থাকে। Sort করলে O(n log n)।" : "Greedy choice: the activity that <b>finishes</b> first — it leaves the most room for the rest. O(n log n) for the sort.",
        knapsack: bn ? "Fractional knapsack এ greedy (v/w বেশি আগে) সর্বোত্তম। কিন্তু <b>0/1 knapsack</b> এ greedy ভুল হতে পারে — সেখানে DP লাগে।" : "Greedy by v/w is optimal for the fractional knapsack. For the <b>0/1 knapsack</b> greedy can fail — use DP.",
        huffman: bn ? "সবচেয়ে কম frequency এর দুটো tree জোড়া লাগাও। ঘন ঘন আসা অক্ষর ছোট code পায়। Prefix-free: কোনো code অন্যটার শুরু না। O(n log n)।" : "Repeatedly merge the two least-frequent trees. Frequent symbols get short codes. Codes are prefix-free. O(n log n).",
      };
      ui.info.replaceChildren(...parts, note(tips[s.mode]));
    }
    run();
    return { set(p) { Object.assign(s, p); seg.set(s.mode); run(); }, destroy() { P.destroy(); } };
  },
};
