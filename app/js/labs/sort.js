// Divide & conquer / sorting lab: merge sort, quick sort, insertion sort and binary search on animated bars.
import { h, lang, texHTML } from "../ui.js";
import { segmented, note, button } from "./kit.js";
import { vshell, player, svgBox, bars, parseNums, inputRow } from "./viz.js";
import { mergeSort, quickSort, insertionSort, binarySearch, ri, shuffle } from "../dsa.js";

export default {
  id: "sort", icon: "repeat",
  title: { en: "Sorting & Divide-and-Conquer Lab", bn: "Sorting ও Divide-and-Conquer ল্যাব" },
  blurb: { en: "Divide, conquer, combine — live. Merge sort splits and merges, quick sort partitions around a pivot, binary search halves the range. Count the comparisons yourself.", bn: "Divide, conquer, combine — চোখের সামনে। Merge sort ভাগ করে জোড়া দেয়, quick sort pivot ঘিরে partition করে, binary search range অর্ধেক করে। তুলনা নিজে গুনে দেখো।" },
  topics: ["dnc", "search-sort", "analysis"],
  mount(host, preset = {}) {
    const bn = lang() === "bn";
    const s = Object.assign({ algo: "merge", arr: [38, 27, 43, 3, 9, 82, 10], target: 43 }, preset);
    const ui = vshell(host, preset);
    const draw = (f) => {
      const svg = svgBox(640, 300); const a = f.a;
      const inR = (k) => f.range && k >= f.range[0] && k <= f.range[1];
      bars(svg, a, { cls: (k) => [f.done ? "ok" : "", f.range && !inR(k) ? "dim" : "", f.piv === k ? "piv" : "", (f.fixed || []).includes(k) ? "ok" : "", f.i === k || f.j === k || f.key === k || f.mid === k ? "hl" : "", f.merged && inR(k) ? "merged" : "", f.sortedTo !== undefined && k <= f.sortedTo ? "ok" : ""].join(" ") });
      ui.view.replaceChildren(svg);
    };
    const P = player(ui, draw);
    function run() {
      if (s.algo === "merge") P.load(mergeSort(s.arr).frames);
      else if (s.algo === "quick") P.load(quickSort(s.arr).frames);
      else if (s.algo === "insertion") P.load(insertionSort(s.arr).frames);
      else { const a = [...s.arr].sort((x, y) => x - y); P.load(binarySearch(a, s.target).frames); }
      info();
    }
    const seg = segmented([["merge", "merge sort"], ["quick", "quick sort"], ["insertion", "insertion sort"], ["binary", "binary search"]].map(([value, label]) => ({ value, label })), s.algo, (v) => { s.algo = v; run(); });
    const arrIn = inputRow(bn ? "array" : "array", s.arr.join(", "), bn ? "সেট" : "Set", (v) => { const a = parseNums(v, 14); if (a.length) { s.arr = a; run(); } });
    const tIn = inputRow(bn ? "binary search এর target" : "binary search target", s.target, bn ? "খোঁজো" : "Search", (v) => { const x = parseNums(v)[0]; if (x !== undefined) { s.target = x; s.algo = "binary"; seg.set("binary"); run(); } });
    ui.controls.append(seg, arrIn, tIn, h("div.row",
      button(bn ? "এলোমেলো" : "Random", () => { s.arr = Array.from({ length: ri(7, 10) }, () => ri(2, 99)); arrIn.input.value = s.arr.join(", "); run(); }, "small"),
      button(bn ? "আগেই sorted" : "Already sorted", () => { s.arr = [...s.arr].sort((a, b) => a - b); arrIn.input.value = s.arr.join(", "); run(); }, "small"),
      button(bn ? "উল্টো" : "Reversed", () => { s.arr = [...s.arr].sort((a, b) => b - a); arrIn.input.value = s.arr.join(", "); run(); }, "small")));
    function info() {
      const n = s.arr.length;
      const stats = s.algo === "merge" ? mergeSort(s.arr).comps : s.algo === "quick" ? quickSort(s.arr).comps : s.algo === "insertion" ? insertionSort(s.arr).comps : binarySearch([...s.arr].sort((a, b) => a - b), s.target).probes;
      const rec = { merge: "T(n)=2T(n/2)+\\Theta(n)=\\Theta(n\\log n)", quick: "T(n)=T(q)+T(n-q-1)+\\Theta(n)", insertion: "\\Theta(n)\\ \\text{best},\\ \\Theta(n^2)\\ \\text{worst}", binary: "T(n)=T(n/2)+\\Theta(1)=\\Theta(\\log n)" }[s.algo];
      ui.info.replaceChildren(h("div.mathblock", { html: texHTML(rec, true) }),
        h("div.kv", h("div", h("b", "n "), String(n)), h("div", h("b", s.algo === "binary" ? "probes " : bn ? "তুলনা " : "comparisons "), String(stats)), h("div", h("b", "n log₂ n "), String(Math.round(n * Math.log2(n)))), h("div", h("b", "n² "), String(n * n))),
        note({
          merge: bn ? "Merge sort সবসময় Θ(n log n), stable, কিন্তু merge এর জন্য O(n) অতিরিক্ত জায়গা লাগে।" : "Merge sort is always Θ(n log n) and stable, but needs O(n) extra space for merging.",
          quick: bn ? "Quick sort in-place, গড়ে Θ(n log n)। কিন্তু শেষ element pivot আর ইনপুট আগে থেকেই sorted হলে partition একপেশে → Θ(n²)। 'আগেই sorted' চেপে দেখো!" : "Quick sort is in place and Θ(n log n) on average — but with a last-element pivot on sorted input every partition is lopsided → Θ(n²). Try 'Already sorted'!",
          insertion: bn ? "Insertion sort প্রায়-sorted ডেটায় দ্রুত (Θ(n)); উল্টো ক্রমে সবচেয়ে ধীর।" : "Insertion sort is fast on nearly-sorted data (Θ(n)); reversed input is its worst case.",
          binary: bn ? "Binary search শুধু sorted array তে চলে। প্রতিটা probe এ range অর্ধেক → সর্বোচ্চ ⌊log₂ n⌋+1 probe।" : "Binary search needs a sorted array. Each probe halves the range → at most ⌊log₂ n⌋+1 probes.",
        }[s.algo]),
        note(bn ? "Comparison-based sorting এর lower bound Ω(n log n) — decision tree এ n! টা leaf লাগে, height ≥ log₂(n!) ≈ n log n।" : "Any comparison sort needs Ω(n log n) comparisons: its decision tree has n! leaves, so height ≥ log₂(n!) ≈ n log n."));
    }
    run();
    return { set(p) { Object.assign(s, p); seg.set(s.algo); arrIn.input.value = s.arr.join(", "); run(); }, destroy() { P.destroy(); } };
  },
};
