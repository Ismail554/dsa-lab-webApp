// AVL lab: insert keys into a BST or an AVL tree, see balance factors and LL / RR / LR / RL rotations.
import { h, lang, texHTML } from "../ui.js";
import { segmented, note, button } from "./kit.js";
import { vshell, player, svgBox, layoutBinary, drawBinary, parseNums, inputRow } from "./viz.js";
import { avlInsert, avlBuild, bf, preorder, inorder, postorder, levelorder, heightOf, ri } from "../dsa.js";

export default {
  id: "avl", icon: "target",
  title: { en: "AVL Tree & Rotations Lab", bn: "AVL Tree ও Rotation ল্যাব" },
  blurb: { en: "Insert keys and watch balance factors. Switch balancing off to see a skewed BST, on to see LL, RR, LR and RL rotations keep the height O(log n).", bn: "Key insert করো আর balance factor দেখো। Balancing বন্ধ করলে skewed BST, চালু করলে LL, RR, LR, RL rotation height কে O(log n) রাখে।" },
  topics: ["avl"],
  mount(host, preset = {}) {
    const bn = lang() === "bn";
    const s = Object.assign({ keys: [10, 20, 30], balance: true, next: 25 }, preset);
    const ui = vshell(host, preset);
    let tree = null;
    const draw = (f) => {
      const svg = svgBox(640, 330);
      if (f.t) drawBinary(svg, layoutBinary(f.t), { W: 640, H: 330, label: (n) => n.k, sub: (n) => `bf ${bf(n) > 0 ? "+" : ""}${bf(n)}`,
        cls: (n) => [f.hl?.includes(n.k) ? "hl" : "", f.bad?.includes(n.k) ? "bad" : "", Math.abs(bf(n)) > 1 ? "bad" : ""].join(" ") });
      ui.view.replaceChildren(svg); info(f.t);
    };
    const P = player(ui, draw);
    function rebuild(showLast = true) {
      const prev = s.keys.slice(0, -1); const last = s.keys[s.keys.length - 1];
      const base = avlBuild(prev, { balance: s.balance }).tree;
      if (!showLast || last === undefined) { tree = avlBuild(s.keys, { balance: s.balance }).tree; P.load([{ t: tree, msg: { en: "Empty tree — insert a key.", bn: "খালি tree — একটা key insert করো।" } }]); return; }
      const r = avlInsert(base, last, { balance: s.balance }); tree = r.result; P.load(r.frames);
    }
    const keysIn = inputRow(bn ? "key ক্রম, যেমন 10 20 30" : "key sequence, e.g. 10 20 30", s.keys.join(", "), bn ? "বানাও" : "Build", (v) => { s.keys = parseNums(v, 15); rebuild(); });
    const addIn = inputRow(bn ? "নতুন key" : "next key", s.next, "Insert", (v, inp) => { const x = parseNums(v)[0]; if (x === undefined || s.keys.includes(x)) return; s.keys.push(x); keysIn.input.value = s.keys.join(", "); inp.value = ri(1, 99); rebuild(); });
    const balSeg = segmented([{ value: true, label: "AVL" }, { value: false, label: { en: "plain BST", bn: "সাধারণ BST" } }], s.balance, (v) => { s.balance = v; rebuild(); });
    ui.controls.append(balSeg, keysIn, addIn,
      h("div.row", button(bn ? "সাজানো ইনপুট 1..7" : "Sorted input 1..7", () => { s.keys = [1, 2, 3, 4, 5, 6, 7]; keysIn.input.value = s.keys.join(", "); rebuild(); }, "small"),
        button("LR", () => { s.keys = [30, 10, 20]; keysIn.input.value = s.keys.join(", "); rebuild(); }, "small"), button("RL", () => { s.keys = [10, 30, 20]; keysIn.input.value = s.keys.join(", "); rebuild(); }, "small"),
        button(bn ? "মুছে ফেলো" : "Clear", () => { s.keys = []; keysIn.input.value = ""; rebuild(); }, "small")));
    function info(t) {
      const n = s.keys.length;
      ui.info.replaceChildren(
        h("div.mathblock", { html: texHTML("\\text{bf}(v)=h(\\text{left})-h(\\text{right})\\in\\{-1,0,+1\\}") }),
        h("div.kv", h("div", h("b", "height "), String(heightOf(t))), h("div", h("b", "n "), String(n)), h("div", h("b", "⌊log₂ n⌋ "), String(n ? Math.floor(Math.log2(n)) : "—"))),
        h("div.trav", ["pre", "in", "post", "level"].map((k) => h("div", h("b", `${k}-order: `), (k === "pre" ? preorder : k === "in" ? inorder : k === "post" ? postorder : levelorder)(t).join(" ")))),
        note(bn ? "<b>LL</b> (বামের বামে ভারী) → right rotation · <b>RR</b> → left rotation · <b>LR</b> → আগে left, পরে right · <b>RL</b> → আগে right, পরে left। In-order সবসময় sorted থাকে — rotation BST order ভাঙে না।" : "<b>LL</b> (left-left heavy) → right rotation · <b>RR</b> → left rotation · <b>LR</b> → left then right · <b>RL</b> → right then left. In-order stays sorted — rotations never break BST order."));
    }
    rebuild();
    return { set(p) { Object.assign(s, p); balSeg.set(s.balance); keysIn.input.value = s.keys.join(", "); rebuild(); }, destroy() { P.destroy(); } };
  },
};
