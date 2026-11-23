// B-tree lab: insert keys into a B-tree of order m; watch overflow, median split and the tree growing from the root.
import { h, lang } from "../ui.js";
import { segmented, note, button } from "./kit.js";
import { vshell, player, svgBox, S, isoRect, parseNums, inputRow } from "./viz.js";
import { btreeInsert, btreeBuild, btreeHeight, btreeNodes, ri } from "../dsa.js";

function drawB(svg, root, hl = [], W = 640) {
  if (!root || !root.keys.length) return;
  const CW = 30, PAD = 8, GAP = 14;
  const width = (n) => (n.kids.length ? Math.max(n.kids.reduce((a, k) => a + width(k), 0) + GAP * (n.kids.length - 1), n.keys.length * CW + PAD) : n.keys.length * CW + PAD);
  const total = width(root); const scale = Math.min(1, (W - 20) / total);
  const g = S("g", { transform: `translate(${(W - total * scale) / 2},16) scale(${scale})` }); svg.append(g);
  const place = (n, x0, depth) => {
    const w = width(n); const nw = n.keys.length * CW + PAD; const x = x0 + (w - nw) / 2; const y = depth * 78;
    let cx = x0; const kidTops = [];
    n.kids.forEach((k) => { const kw = width(k); kidTops.push(place(k, cx, depth + 1)); cx += kw + GAP; });
    kidTops.forEach(([tx, ty], i) => g.append(S("line", { x1: x + PAD / 2 + i * CW, y1: y + 30, x2: tx, y2: ty, class: "t-edge" })));
    const box = S("g", { class: "b-node", transform: `translate(${x},${y})` }, isoRect({ width: nw, height: 30 }, 7));
    n.keys.forEach((k, i) => { box.append(S("text", { x: PAD / 2 + i * CW + CW / 2, y: 15, dy: "0.35em", "text-anchor": "middle", class: hl.includes(k) ? "b-hl" : "" }, String(k))); if (i) box.append(S("line", { x1: PAD / 2 + i * CW, y1: 4, x2: PAD / 2 + i * CW, y2: 26, class: "b-sep" })); });
    g.append(box);
    return [x + nw / 2, y];
  };
  place(root, 0, 0);
}

export default {
  id: "btree", icon: "cards",
  title: { en: "B-Tree Lab", bn: "B-Tree ল্যাব" },
  blurb: { en: "Disk-friendly multiway search trees. Insert keys into a B-tree of order 3, 4 or 5 and watch full nodes split at the median and push it upward.", bn: "Disk-এর জন্য উপযোগী multiway search tree। Order 3, 4 বা 5 এর B-tree তে key insert করো আর দেখো full node median এ split হয়ে উপরে ওঠে।" },
  topics: ["btree"],
  mount(host, preset = {}) {
    const bn = lang() === "bn";
    const s = Object.assign({ m: 3, keys: [10, 20, 30, 40, 50] }, preset);
    const ui = vshell(host, preset);
    let tree = null;
    const draw = (f) => { const svg = svgBox(640, 330); drawB(svg, f.t, f.hl || []); ui.view.replaceChildren(svg); info(f.t); };
    const P = player(ui, draw, { state: (f) => {
      const bn = lang() === "bn";
      return [
        { label: bn ? "Insert ক্রম" : "Insert order", items: s.keys },
        f.hl && f.hl.length ? { label: bn ? "এখন" : "Now", items: f.hl, tone: "hot" } : null,
        { label: bn ? "সর্বোচ্চ key/node" : "max keys / node", items: [s.m - 1] },
        { label: "height", items: [f.t ? btreeHeight(f.t) : "—"] },
      ];
    } });
    function rebuild() {
      const prev = btreeBuild(s.keys.slice(0, -1), s.m).tree; const last = s.keys[s.keys.length - 1];
      if (last === undefined) { tree = null; P.load([{ t: null, msg: { en: "Empty B-tree.", bn: "খালি B-tree।" } }]); return; }
      const r = btreeInsert(prev, last, s.m); tree = r.result; P.load(r.frames, 0, "btree");
    }
    const keysIn = inputRow(bn ? "key ক্রম" : "key sequence", s.keys.join(", "), bn ? "বানাও" : "Build", (v) => { s.keys = parseNums(v, 24); rebuild(); });
    const addIn = inputRow(bn ? "নতুন key" : "next key", 60, "Insert", (v, inp) => { const x = parseNums(v)[0]; if (x === undefined || s.keys.includes(x)) return; s.keys.push(x); keysIn.input.value = s.keys.join(", "); inp.value = ri(1, 99); rebuild(); });
    const mSeg = segmented([3, 4, 5].map((m) => ({ value: m, label: `m = ${m}` })), s.m, (v) => { s.m = v; rebuild(); });
    ui.controls.append(mSeg, keysIn, addIn, h("div.row", button(bn ? "১..১৫ ক্রমে" : "1..15 in order", () => { s.keys = Array.from({ length: 15 }, (_, i) => i + 1); keysIn.input.value = s.keys.join(", "); rebuild(); }, "small"), button(bn ? "মুছে ফেলো" : "Clear", () => { s.keys = []; keysIn.input.value = ""; rebuild(); }, "small")));
    function info(t) {
      const m = s.m;
      ui.info.replaceChildren(
        h("div.kv", h("div", h("b", "order m "), String(m)), h("div", h("b", bn ? "সর্বোচ্চ key " : "max keys "), String(m - 1)), h("div", h("b", "height "), String(t ? btreeHeight(t) : "—")), h("div", h("b", "nodes "), String(btreeNodes(t)))),
        note(bn ? `<b>নিয়ম (order m):</b> প্রতি node এ সর্বোচ্চ ${m - 1} key ও ${m} child; root ছাড়া প্রতি node এ কমপক্ষে ⌈m/2⌉−1 = ${Math.ceil(m / 2) - 1} key; সব leaf একই depth এ। Overflow হলে index ⌈m/2⌉−1 এর median উপরে যায়।` : `<b>Rules (order m):</b> at most ${m - 1} keys and ${m} children per node; every non-root node holds at least ⌈m/2⌉−1 = ${Math.ceil(m / 2) - 1} keys; all leaves at the same depth. On overflow the median (index ⌈m/2⌉−1) moves up.`),
        note(bn ? "B-tree শুধু root split হলেই লম্বা হয় — তাই সব leaf একই level এ থাকে। Height O(log_m n), তাই disk read কম লাগে।<br><b>B+ tree:</b> সব data leaf এ থাকে, internal node এ শুধু routing key কপি থাকে, আর leaf গুলো linked list — range query দ্রুত।" : "A B-tree only grows taller when the root splits — so all leaves stay on one level. Height is O(log_m n), so few disk reads.<br><b>B+ tree:</b> all records live in the leaves, internal nodes hold copies of routing keys, and leaves are linked — fast range scans."));
    }
    rebuild();
    return { set(p) { Object.assign(s, p); mSeg.set(s.m); keysIn.input.value = s.keys.join(", "); rebuild(); }, destroy() { P.destroy(); } };
  },
};
