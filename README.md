# DSA Lab — CSE 2205 interactive algorithms laboratory

A visual, interactive learning and exam-prep app for **Data Structures & Algorithms II** (CUB, Fall 2026), built from the course outline and class notes in the parent folder. Same design as Complex Lab (the MATH 2361 app), rebuilt for DSA.

## Run it

```powershell
cd D:\2205_DSA\dsa-lab
npm install      # first time only
npm start        # → http://localhost:5174
```

No build step: the app is plain ES modules served by `server.mjs`. (Port 5174, so it can run next to Complex Lab on 5173.)

## What's inside

| Area | What it does |
|---|---|
| **Learn** | 18 lessons covering weeks 1–12 (EN + বাংলা). **Story first, no code:** each lesson opens with an everyday Bangladeshi story (an office hierarchy for heaps, a rickshaw-wala's cheapest route for Dijkstra, a rough notebook for DP…). Then come the visual steps, each driving a live lab, with a checkpoint to pass before moving on. Every lesson ends with a Feynman "explain it back" step that scores your explanation. |
| **Labs** | 9 step-by-step visualizers, each with play, pause and step controls. Use your own input or the textbook examples. **Growth & step counting** compares growth rates and counts loop iterations. **Recursion tree & Master Theorem** draws the tree for your a, b, k, p, shows the work per level and picks the case; it also animates a call stack. **Binary tree & heap** covers indexing (0- or 1-based), insert, delete-root, build-heap and heap sort. **AVL** shows balance factors and the LL / RR / LR / RL rotations, plus traversals. **B-tree** inserts into a tree of order 3, 4 or 5 and shows the splits. **Graphs** covers adjacency matrix and list, BFS, DFS, Dijkstra, Bellman-Ford, Prim and Kruskal. **Sorting** animates merge sort, quick sort, insertion sort and binary search. **Greedy** covers activity selection, fractional knapsack and Huffman coding. **DP** covers Fibonacci (plain recursion vs memoization), 0/1 knapsack, LCS and matrix chain. |
| **Practice** | 95 questions: every practice question in the notes (heap identification, indexing, insert and delete, space Q1–4, all Master Theorem practice questions and examples) plus exam-style questions for each week. Answers are auto-checked. The checker understands complexity classes (`n log n`, `Θ(n^2)`, `n/log n`, `n^1.585`…), arrays and sequences (`70 30 50…`, `A → B → C`) and numbers (`log2(64)`, `floor(7/2)`). Definitions, explanations and Java code are marked against key-point rubrics, with a model answer for each. 29 generators produce unlimited fresh problems, solved by the same engine that drives the labs. |
| **Mock Test, Smart Revision, Formula Cards, Progress & Map** | Same as Complex Lab: tests weighted toward your weak topics, spaced-repetition cards, a knowledge map (Midterm and Final parts), and export/import of your progress. |
| **Jarvis tutor** | Gemini-powered when the key is set, otherwise an offline Socratic tutor. The offline tutor has built-in tools: `T(n)=2T(n/2)+n log n` (Master Theorem solver), `bigo 3n^2+5n log n` (gives the tight bound), `heap 4 10 3 5 1` (builds a heap). |
| **Library & Upload** | Drop `.md .pdf .txt .tex .html` files into `dsa-lab/materials/`, or upload them on the Library page. They are analysed and linked to topics. Future topics such as hashing, red-black trees, Floyd–Warshall, network flow, backtracking and NP-completeness appear as new map nodes. `.md` files in `D:\2205_DSA` are picked up too. |

## Algo Lab–style upgrades

Ideas taken from [Algo Lab](https://byte-sized-algorithms.vercel.app) (its source is not public; this is our own code):

* **Live pseudocode:** every animated algorithm (34 of them) shows its pseudocode, and the lines running at the current step light up. `tests/pseudo.test.mjs` checks every step maps to real lines.
* **State box:** each step shows the named state: queue, call stack, finalised vertices, pivot and i/j, current DP cell, load factor and so on.
* **3D blocks:** nodes, arrays, bars and B-tree nodes are drawn as isometric-style blocks on an isometric grid; the active block gets hatched sides.
* **New lab and lessons:** a Stacks, Queues, Lists, Hashing & Tries lab, topological sort in the graph lab, and 5 "Extra" lessons (beyond the syllabus) with stories, 14 questions and 6 generators.

## AI tutor (Gemini) and custom instructions

* `dsa-lab/.env` holds `GEMINI_API_KEY=...`. It is the same key as Complex Lab and is git-ignored. Only the server reads it.
* **`tutor-instructions.md`** holds Jarvis's instructions, in Bangla. They cover the story-first and Socratic teaching style, the language rules, the week-by-week syllabus and the course conventions: 0-based indexing, height counted in edges, alphabetical neighbour order, Lomuto partition, and Java for code. Edit the file and the next message uses it, with no restart needed. On Vercel the `/api/ai` function reads the same file (`includeFiles` in `vercel.json`).
* Teaching language defaults to বাংলা. Use the 🌐 button to switch to English.

## Tests

```powershell
npm test
```

Runs the logic checks and the pseudocode-mapping check. They cover the complexity parser and the answer checker, the algorithms (heaps, AVL, sorts, Huffman, LCS, matrix chain), and the stored answers: every bank question, every lesson checkpoint, and 60 runs of every generator.
