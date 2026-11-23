// Every animated step should light up at least one pseudocode line (except intro / final summary frames).
import * as D from "../app/js/dsa.js";
import { annotate, PSEUDO } from "../app/js/labs/pseudo.js";

const G = { n: 6, directed: false, edges: [[0, 1, 4], [0, 2, 2], [1, 2, 1], [1, 3, 5], [2, 3, 8], [2, 4, 10], [3, 4, 2], [3, 5, 6], [4, 5, 3]].map(([u, v, w]) => ({ u, v, w })) };
const DG = { n: 6, directed: true, edges: [[0, 1, 3], [0, 2, 1], [2, 1, 1], [1, 3, 2], [2, 4, 6], [3, 4, 1], [3, 5, 7], [4, 5, 2]].map(([u, v, w]) => ({ u, v, w })) };
const NG = { n: 5, directed: true, edges: [[0, 1, 6], [0, 2, 7], [1, 2, 8], [1, 3, 5], [1, 4, -4], [2, 3, -3], [2, 4, 9], [3, 1, -2], [4, 3, 7], [4, 0, 2]].map(([u, v, w]) => ({ u, v, w })) };
const runs = {
  heapInsert: D.heapInsert([50, 30, 40, 10, 20], 70).frames, heapExtract: D.heapExtract([100, 50, 60, 20, 40, 30, 10]).frames,
  buildHeap: D.buildHeap([4, 10, 3, 5, 1]).frames, heapSort: D.heapSort([4, 10, 3, 5, 1]).frames,
  avl: D.avlInsert(D.avlBuild([10, 20]).tree, 30).frames, bst: D.avlInsert(D.avlBuild([10, 20], { balance: false }).tree, 30, { balance: false }).frames,
  btree: D.btreeInsert(D.btreeBuild([10, 20], 3).tree, 30, 3).frames,
  bfs: D.bfs(G).frames, dfs: D.dfs(G).frames, dijkstra: D.dijkstra(G).frames, bellman: D.bellmanFord(NG).frames, prim: D.prim(G).frames, kruskal: D.kruskal(G).frames, topo: D.topo(DG).frames,
  merge: D.mergeSort([5, 2, 4, 7, 1]).frames, quick: D.quickSort([2, 8, 7, 1, 3, 5]).frames, insertion: D.insertionSort([5, 2, 4, 6]).frames, binary: D.binarySearch([1, 3, 5, 7, 9], 7).frames,
  activity: D.activitySelect([{ name: "a", s: 1, f: 4 }, { name: "b", s: 3, f: 5 }, { name: "c", s: 5, f: 7 }]).frames, fknap: D.fracKnapsack([{ name: "x", w: 10, v: 60 }, { name: "y", w: 20, v: 100 }], 25).frames,
  huffman: D.huffman([["a", 5], ["b", 9], ["c", 12]]).frames, knap01: D.knapsack01([{ name: "A", w: 1, v: 1 }, { name: "B", w: 3, v: 4 }], 4).frames, lcs: D.lcs("ABC", "AC").frames, mcm: D.matrixChain([10, 30, 5, 60]).frames,
  stack: D.stackOps(["push 1", "push 2", "pop", "peek", "pop", "pop"]).frames, queue: D.queueOps(["enqueue 1", "enqueue 2", "dequeue"], 3).frames,
  listHead: D.listOp([1, 2], "head", 9).frames, listTail: D.listOp([1, 2], "tail", 9).frames, listInsert: D.listOp([1, 2, 3], "insert", 9, 2).frames, listDelete: D.listOp([1, 2, 3], "delete", 2).frames, listReverse: D.listOp([1, 2, 3], "reverse").frames,
  hashChain: D.hashInsert([10, 17, 3], 7, "chain").frames, hashProbe: D.hashInsert([10, 17, 3], 7, "probe").frames, trie: D.trieBuild(["car", "cat"], "ca").frames,
};
let fail = 0;
for (const [key, frames] of Object.entries(runs)) {
  if (!PSEUDO[key]) { fail++; console.log("NO PSEUDO", key); continue; }
  annotate(key, frames);
  const n = PSEUDO[key].lines.length;
  frames.forEach((f, i) => {
    const intro = i === 0, last = i === frames.length - 1;
    if (f.ln.some((l) => l < 1 || l > n)) { fail++; console.log("BAD LINE", key, i, f.ln); }
    if (!f.ln.length && !intro && !last && !f.done) { fail++; console.log("UNMAPPED", key, i, f.msg.en); }
  });
}
console.log(fail ? `${fail} pseudocode problem(s)` : `pseudocode mapping ok · ${Object.keys(runs).length} algorithms`);
process.exit(fail ? 1 : 0);
