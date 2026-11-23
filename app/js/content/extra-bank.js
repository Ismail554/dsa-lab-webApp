// Exam-style questions for the "Beyond the syllabus" lessons.
const A = (id, topic, q, fields, solution, extra = {}) => ({ id, set: "extra", topic, src: "Extra", q, type: "auto", fields, solution, marks: extra.marks || 3, ...extra });
const Th = (id, topic, q, answer, points, extra = {}) => ({ id, set: "extra", topic, src: "Extra", q, type: "theory", answer, points, marks: extra.marks || 4, ...extra });
const f = (label, ans, kind, o = {}) => ({ label, ans, kind, ...o });

export const EXTRA_BANK = [
  A("x-st1", "stackqueue", "Stack operations: push 4, push 9, pop, push 2, push 7, pop, pop. Which values are popped, in order?", [f("popped", "9, 7, 2", "seq")], ["9 is on top when the first pop happens.", "Then 7 (top), then 2."], { lab: { id: "linear", preset: { mode: "stack", sOps: "push 4, push 9, pop, push 2, push 7, pop, pop" } } }),
  A("x-st2", "stackqueue", "Circular queue with capacity 6: front = 4, size = 5. Index of the next enqueue?", [f("rear", "3", "num")], ["rear = (front + size) mod cap = (4 + 5) mod 6 = 3."]),
  Th("x-st3", "stackqueue", "Compare a stack and a queue: order of removal, operations, and two applications of each.",
    "A **stack** is LIFO: push and pop happen at the top, both O(1). Applications: function call stack, undo, bracket matching, DFS. A **queue** is FIFO: enqueue at the rear, dequeue at the front, both O(1) (circular array or linked list). Applications: BFS, printer/CPU scheduling, buffers.",
    [["lifo", "last in"], ["fifo", "first in"], ["push", "pop"], ["enqueue", "dequeue"], ["bfs", "dfs", "undo", "call stack", "schedul"]]),
  A("x-ll1", "linkedlist", "Delete 30 from the list 10 → 20 → 30 → 40. What is the list afterwards?", [f("list", "10 20 40", "seq")], ["Walk until cur = 30 (prev = 20).", "Set 20.next = 40."], { lab: { id: "linear", preset: { mode: "list", lop: "delete", lx: 30, list: [10, 20, 30, 40] } } }),
  A("x-ll2", "linkedlist", "Time to access the k-th element of a singly linked list with n nodes (worst case)?", [f("T", "n", "bigo")], ["You must follow next pointers from the head: up to n steps."]),
  Th("x-ll3", "linkedlist", "Write an algorithm to reverse a singly linked list in place and state its complexity.",
    "```\nNode reverse(Node head) {\n  Node prev = null, cur = head;\n  while (cur != null) {\n    Node next = cur.next;\n    cur.next = prev;\n    prev = cur;\n    cur = next;\n  }\n  return prev;\n}\n```\nEach node is visited once: O(n) time, O(1) extra space.",
    [["prev"], ["next"], ["cur.next = prev", "cur.next=prev"], ["return prev", "head = prev"], ["o(n)"]], { marks: 5 }),
  A("x-h1", "hashing", "h(k) = k mod 11. Which slot does key 57 go to?", [f("slot", "2", "num")], ["57 = 5·11 + 2 → slot 2."]),
  A("x-h2", "hashing", "Linear probing, m = 7: insert 50, 700, 76, 85, 92 in order. In which slot does 92 end up?", [f("slot", "3", "num")], ["50→1, 700→0, 76→6, 85→1 taken → 2, 92→1 taken, 2 taken → 3."], { lab: { id: "linear", preset: { mode: "hash", hmode: "probe", keys: [50, 700, 76, 85, 92], m: 7 } } }),
  A("x-h3", "hashing", "A table of size 20 holds 15 keys. Load factor α?", [f("α", "0.75", "num")], ["α = n/m = 15/20 = 0.75."]),
  Th("x-h4", "hashing", "What is a collision? Explain chaining and linear probing.",
    "A **collision** happens when two different keys hash to the same slot. **Chaining:** each slot holds a linked list; colliding keys are appended to it; search costs O(1 + α) on average. **Linear probing** (open addressing): if slot h(k) is taken, try h(k)+1, h(k)+2, … mod m until a free slot; keys stay inside the array, but clusters form and performance drops as α approaches 1.",
    [["same slot", "same index", "same position", "একই"], ["chain", "list"], ["probe", "next slot", "h(k)+1", "h(k) + 1"], ["load factor", "α", "alpha"], ["cluster", "o(1"]], { marks: 5 }),
  A("x-t1", "trie", "Nodes (including the root) in a trie storing: an, ant, and, any?", [f("nodes", "6", "num")], ["root → a → n, then t, d, y under n.", "1 + 1 + 1 + 3 = 6."], { lab: { id: "linear", preset: { mode: "trie", words: ["an", "ant", "and", "any"], find: "an" } } }),
  A("x-t2", "trie", "Time to search a word of length L in a trie holding n words?", [f("T", "L", "text", { show: "O(L)", alt: ["o(l)", "θ(l)", "l"] })], ["One step per character, independent of n."]),
  A("x-tp1", "topo", "Edges: A→C, B→C, C→D, B→D. Topological order (smallest ready vertex first)?", [f("order", "A B C D", "seq")], ["In-degree 0: A, B. Take A, then B; C becomes ready, then D."]),
  Th("x-tp2", "topo", "What is a topological sort and when does one exist? Describe Kahn's algorithm.",
    "A **topological order** of a directed graph lists the vertices so that every edge u → v has u before v. It exists **iff the graph is a DAG** (no directed cycle). **Kahn's algorithm:** compute in-degrees; put every vertex with in-degree 0 in a queue; repeatedly remove one, output it, and decrement the in-degree of its out-neighbours, enqueuing any that reach 0. If fewer than V vertices are output, the graph has a cycle. Time O(V + E).",
    [["every edge", "u before v", "before"], ["dag", "acyclic", "no cycle"], ["in-degree", "indegree"], ["0", "zero"], ["v+e", "v + e"]], { marks: 5 }),
];
