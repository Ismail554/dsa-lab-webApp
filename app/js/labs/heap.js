// Binary tree & heap lab: array ↔ tree, indexing, insert / delete-root / build-heap / heap sort, step by step.
import { h, L, lang, texHTML } from "../ui.js";
import { segmented, note, button } from "./kit.js";
import { vshell, player, svgBox, layoutBinary, drawBinary, heapTree, arrayStrip, parseNums, inputRow } from "./viz.js";
import { heapInsert, heapExtract, buildHeap, heapSort, heapKind, parentIdx, leftIdx, rightIdx, treeHeight, ri } from "../dsa.js";

export default {
  id: "heap", icon: "map",
  title: { en: "Binary Tree & Heap Lab", bn: "Binary Tree ও Heap ল্যাব" },
  blurb: { en: "See an array become a complete binary tree. Insert, delete the root, build a heap in O(n) and run heap sort — every comparison and swap animated.", bn: "Array কীভাবে complete binary tree হয় দেখো। Insert, root delete, O(n) এ build heap, আর heap sort — প্রতিটা তুলনা ও swap অ্যানিমেশনে।" },
  topics: ["trees", "heap", "heapsort"],
  mount(host, preset = {}) {
    const bn = lang() === "bn";
    const s = Object.assign({ type: "max", arr: [100, 50, 60, 20, 40, 30, 10], op: "view", value: 70, one: false, sel: 1 }, preset);
    const ui = vshell(host, preset);
    let cur = { a: s.arr, hl: [], ok: [], n: s.arr.length };
    const draw = (f) => {
      cur = f; const a = f.a; const n = f.n ?? a.length;
      const svg = svgBox(640, 300);
      const root = heapTree(a);
      if (root) drawBinary(svg, layoutBinary(root), { W: 640, H: 300, label: (nd) => nd.k, sub: (nd) => String(s.one ? nd.i + 1 : nd.i),
        cls: (nd) => [f.hl?.includes(nd.i) ? "hl" : "", f.ok?.includes(nd.i) ? "ok" : "", f.swap?.includes(nd.i) ? "sw" : "", nd.i >= n ? "done" : "", s.op === "view" && nd.i === s.sel ? "sel" : "", s.op === "view" && [parentIdx(s.sel), leftIdx(s.sel), rightIdx(s.sel)].includes(nd.i) && nd.i !== s.sel ? "rel" : ""].join(" ") });
      svg.addEventListener("click", (e) => { const g = e.target.closest(".t-node"); if (!g || s.op !== "view") return; const idx = [...svg.querySelectorAll(".t-node")].indexOf(g); const lay = layoutBinary(heapTree(a)).items; s.sel = lay[idx].node.i; draw(cur); info(); });
      ui.view.replaceChildren(svg, arrayStrip(a, { hl: f.hl || [], ok: f.ok || [], swap: f.swap || [], one: s.one, dim: (k) => k >= n, mark: s.op === "view" ? { [s.sel]: "sel" } : {} }));
    };
    const P = player(ui, draw);
    function run() {
      const a = s.arr;
      if (s.op === "view") P.load([{ a, msg: { en: `Level order → array. Click a node to see its parent and children indices. This array is a ${heapKind(a)} heap.`, bn: `Level order → array। Node এ ক্লিক করে parent ও children এর index দেখো। এই array টা: ${heapKind(a)} heap।` } }]);
      else if (s.op === "insert") P.load(heapInsert(a, s.value, s.type).frames);
      else if (s.op === "extract") P.load(heapExtract(a, s.type).frames);
      else if (s.op === "build") P.load(buildHeap(a, s.type).frames);
      else if (s.op === "sort") P.load(heapSort(a).frames);
      info();
    }
    const opSeg = segmented([{ value: "view", label: { en: "indexing", bn: "indexing" } }, { value: "insert", label: { en: "insert", bn: "insert" } }, { value: "extract", label: { en: "delete root", bn: "root delete" } }, { value: "build", label: { en: "build heap", bn: "build heap" } }, { value: "sort", label: { en: "heap sort", bn: "heap sort" } }], s.op, (v) => { s.op = v; run(); });
    const typeSeg = segmented([{ value: "max", label: "max-heap" }, { value: "min", label: "min-heap" }], s.type, (v) => { s.type = v; run(); });
    const idxSeg = segmented([{ value: false, label: { en: "0-based", bn: "0-based" } }, { value: true, label: { en: "1-based", bn: "1-based" } }], s.one, (v) => { s.one = v; P.go(P.i); info(); });
    const arrIn = inputRow(bn ? "array, যেমন 4 10 3 5 1" : "array, e.g. 4 10 3 5 1", s.arr.join(", "), bn ? "সেট" : "Set", (v) => { const a = parseNums(v, 15); if (a.length) { s.arr = a; run(); } });
    const valIn = inputRow(bn ? "insert করার মান" : "value to insert", s.value, "Insert", (v) => { const x = parseNums(v)[0]; if (x !== undefined) { s.value = x; s.op = "insert"; opSeg.set("insert"); run(); } });
    ui.controls.append(opSeg, typeSeg, idxSeg, arrIn, valIn,
      h("div.row", button(bn ? "এলোমেলো array" : "Random array", () => { s.arr = Array.from({ length: ri(6, 10) }, () => ri(1, 99)); arrIn.input.value = s.arr.join(", "); run(); }, "small"),
        button(bn ? "ফলাফল রাখো" : "Keep result", () => { s.arr = [...cur.a]; arrIn.input.value = s.arr.join(", "); s.op = "view"; opSeg.set("view"); run(); }, "small")));
    function info() {
      const i = s.sel, o = s.one; const I = o ? i + 1 : i;
      const rows = o ? ["\\text{parent}(i)=\\lfloor i/2\\rfloor", "\\text{left}(i)=2i", "\\text{right}(i)=2i+1"] : ["\\text{parent}(i)=\\lfloor (i-1)/2\\rfloor", "\\text{left}(i)=2i+1", "\\text{right}(i)=2i+2"];
      const a = cur.a; const val = (k) => (k >= 0 && k < a.length ? a[k] : "—");
      ui.info.replaceChildren(
        h("div.mathblock", { html: rows.map((r) => texHTML(r)).join("<br>") }),
        s.op === "view" ? note(`${bn ? "নির্বাচিত" : "Selected"} i = <b>${I}</b> (${val(i)}) → parent ${i > 0 ? `<b>${o ? Math.floor(I / 2) : parentIdx(i)}</b> (${val(parentIdx(i))})` : "—"}, left <b>${o ? 2 * I : leftIdx(i)}</b> (${val(leftIdx(i))}), right <b>${o ? 2 * I + 1 : rightIdx(i)}</b> (${val(rightIdx(i))})`) : null,
        note(bn ? `n = ${a.length}, height = ⌊log₂ n⌋ = <b>${treeHeight(a.length)}</b>। Insert ও delete-root এ সর্বোচ্চ height সংখ্যক swap → O(log n)। Build heap O(n), heap sort O(n log n), in-place।` : `n = ${a.length}, height = ⌊log₂ n⌋ = <b>${treeHeight(a.length)}</b>. Insert and delete-root swap at most height times → O(log n). Build-heap is O(n); heap sort O(n log n), in place.`),
        note(bn ? "Heap হলো complete binary tree + heap order (parent ≥ children max-heap এ)। পুরো tree sorted না — শুধু প্রতিটা path sorted।" : "A heap = complete binary tree + heap order (parent ≥ children in a max-heap). It is not globally sorted — only every root-to-leaf path is."));
    }
    run();
    return { set(p) { Object.assign(s, p); opSeg.set(s.op); typeSeg.set(s.type); idxSeg.set(s.one); arrIn.input.value = s.arr.join(", "); run(); }, destroy() { P.destroy(); }, player: P };
  },
};
