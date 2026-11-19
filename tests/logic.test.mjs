// Logic checks: parser, complexity matcher, answer checker, algorithms, every bank answer, every generator.  Run: npm test
import { checkField } from "../app/js/checker.js";
import * as D from "../app/js/dsa.js";
import { GENERATORS } from "../app/js/content/generators.js";
import { BANK } from "../app/js/content/bank.js";
import { TOPICS } from "../app/js/content/curriculum.js";

let fail = 0;
const expect = (name, cond) => { if (!cond) { fail++; console.log("FAIL", name); } };

const cases = [
  [{ ans: "n log n", kind: "bigo" }, "Θ(n lg n)", true], [{ ans: "n log n", kind: "bigo" }, "O(nlogn)", true], [{ ans: "n^2", kind: "bigo" }, "3n² + 5n", true],
  [{ ans: "n^2", kind: "bigo" }, "n log n", false], [{ ans: "n log log n", kind: "bigo" }, "n·log(log n)", true], [{ ans: "n^2/log n", kind: "bigo" }, "n^2 log^-1 n", true],
  [{ ans: "1", kind: "bigo" }, "O(1)", true], [{ ans: "n^1.585", kind: "bigo" }, "n^(log2 3)", true], [{ ans: "log n", kind: "bigo" }, "log₁₀ n", true],
  [{ ans: "[70, 30, 50, 10, 20, 40]", kind: "seq" }, "70 30 50 10 20 40", true], [{ ans: "[70, 30, 50, 10, 20, 40]", kind: "seq" }, "70,50,30,10,20,40", false],
  [{ ans: "A B C D", kind: "seq" }, "A → B → C → D", true], [{ ans: "A B C D", kind: "seq" }, "ABCD", true], [{ ans: "6", kind: "num" }, "log2(64)", true],
  [{ ans: "2", kind: "num" }, "floor((5-1)/2)", true], [{ ans: "max", kind: "text", alt: ["max-heap"] }, "Max-heap", true], [{ ans: "13", kind: "num" }, "d(F) = 13", true],
];
for (const [f, v, want] of cases) expect(`checkField ${v}`, checkField(f, v).ok === want);

expect("heap insert", D.heapInsert([50, 30, 40, 10, 20], 70).result.join() === "70,30,50,10,20,40");
expect("heap delete", D.heapExtract([100, 50, 60, 20, 40, 30, 10]).result.join() === "60,50,30,20,40,10");
expect("heap kinds", ["max", "min", "neither", "neither"].join() === [[90, 50, 70, 20, 40, 60, 65], [10, 20, 30, 40, 50, 60, 70], [100, 80, 90, 70, 60, 95, 50], [10, 30, 20, 40, 25, 50, 35]].map(D.heapKind).join());
expect("heap sort", D.heapSort([5, 3, 9, 1, 7, 2]).result.join() === "1,2,3,5,7,9");
expect("avl", D.preorder(D.avlBuild([10, 20, 30, 40, 50, 25]).tree).join() === "30,20,10,25,40,50");
expect("master 2.2", D.master(2, 2, 1, -1).kase === "2.2");
expect("lcs", D.lcs("ABCBDAB", "BDCABA").len === 4);
expect("mcm", D.matrixChain([30, 35, 15, 5, 10, 20, 25]).best === 15125);
expect("huffman", D.huffman([["a", 45], ["b", 13], ["c", 12], ["d", 16], ["e", 9], ["f", 5]]).bits === 224);
for (let k = 0; k < 40; k++) { const a = D.distinct(D.ri(3, 12)); expect("merge sorts", D.mergeSort(a).result.join() === [...a].sort((x, y) => x - y).join()); expect("quick sorts", D.quickSort(a).result.join() === [...a].sort((x, y) => x - y).join()); expect("build heap valid", D.isHeap(D.buildHeap(a).result)); }

for (const q of BANK) for (const f of q.fields || []) expect(`bank ${q.id} answer self-check (${f.ans})`, checkField(f, f.ans).ok);
for (const t of TOPICS) for (const s of t.steps) if (s.ask && s.ask.type === "input") for (const f of s.ask.fields) expect(`lesson ${t.id} answer self-check (${f.ans})`, checkField(f, f.ans).ok);
for (const g of GENERATORS) for (let k = 0; k < 60; k++) { let p; try { p = g.make(); } catch (e) { expect(`gen ${g.id} throws ${e.message}`, false); break; } for (const f of p.fields) expect(`gen ${g.id} ${f.ans}`, checkField(f, f.ans).ok); }

const ids = new Set(); for (const q of BANK) { expect(`unique id ${q.id}`, !ids.has(q.id)); ids.add(q.id); }
console.log(fail ? `${fail} failure(s)` : `all checks passed · ${TOPICS.length} lessons · ${BANK.length} bank questions · ${GENERATORS.length} generators`);
process.exit(fail ? 1 : 0);
