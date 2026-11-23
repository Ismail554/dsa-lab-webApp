// Pseudocode for every animated algorithm + rules that map each frame (by its English message) to the lines running.
// Line numbers are 1-based. annotate(key, frames) adds f.ln to every frame.

const SIFT = (start) => [
  [`siftDown(a, i, n):`, 0],
  [`  loop:`, 1],
  [`    best = bigger of a[i], a[left(i)], a[right(i)]`, 2],
  [`    if best == i: return        // order holds`, 2],
  [`    swap(a[i], a[best]); i = best`, 2],
].map(([t, ind]) => t);
const siftRules = (o) => [[/vs children/, [o + 2, o + 3]], [/^Swap .* down/, [o + 5]], [/already beats/, [o + 4]], [/leaf now/, [o + 3, o + 4]]];

export const PSEUDO = {
  heapInsert: {
    lines: ["insert(a, x):", "  a.append(x); i = n − 1", "  while i > 0:", "    p = (i − 1) / 2", "    if a[i] <= a[p]: break   // in place", "    swap(a[i], a[p]); i = p"],
    rules: [[/^Place/, [1, 2]], [/^Compare/, [3, 4, 5]], [/^Swap/, [6]], [/in place/, [5]], [/reached the root/, [3]]],
  },
  heapExtract: {
    lines: ["extractTop(a):", "  top = a[0]", "  a[0] = a.removeLast()", "  siftDown(a, 0, n)", "  return top", "", ...SIFT()],
    rules: [[/^Remove the root/, [2]], [/^Move the last/, [3, 4]], ...siftRules(6)],
  },
  buildHeap: {
    lines: ["buildHeap(a):", "  for i = n/2 − 1 down to 0:", "    siftDown(a, i, n)", "", ...SIFT()],
    rules: [[/^Start/, [1, 2]], [/^heapify\(/, [2, 3]], [/^Done/, []], ...siftRules(4)],
  },
  heapSort: {
    lines: ["heapSort(a):", "  buildHeap(a)", "  for end = n − 1 down to 1:", "    swap(a[0], a[end])   // max to the back", "    siftDown(a, 0, end)", "", ...SIFT()],
    rules: [[/^Start/, [2]], [/^heapify\(/, [2]], [/^Done/, [2]], [/^Swap max/, [3, 4]], [/^Sorted ascending/, []], ...siftRules(6)],
  },
  avl: {
    lines: ["insert(node, key):", "  if node == null: return new Node(key)", "  if key < node.key: node.left = insert(node.left, key)", "  else: node.right = insert(node.right, key)", "  update height(node); b = bf(node)", "  if b > 1 and key < node.left.key: return rotateRight(node)       // LL", "  if b < −1 and key > node.right.key: return rotateLeft(node)      // RR", "  if b > 1: node.left = rotateLeft(node.left); return rotateRight(node)   // LR", "  if b < −1: node.right = rotateRight(node.right); return rotateLeft(node) // RL", "  return node"],
    rules: [[/go left/, [3]], [/go right/, [4]], [/new leaf/, [2]], [/LL case/, [5, 6]], [/RR case/, [5, 7]], [/LR case/, [5, 8]], [/RL case/, [5, 9]], [/^Right rotation/, [6]], [/^Left rotation/, [7]], [/^Left-Right/, [8]], [/^Right-Left/, [9]], [/no rotation/, [5, 10]]],
  },
  bst: {
    lines: ["insert(node, key):", "  if node == null: return new Node(key)", "  if key < node.key: node.left = insert(node.left, key)", "  else: node.right = insert(node.right, key)", "  return node      // no balancing!"],
    rules: [[/go left/, [3]], [/go right/, [4]], [/new leaf/, [2]]],
  },
  btree: {
    lines: ["insert(key):", "  leaf = walk down from the root to the right leaf", "  put key into leaf in sorted order", "  while node has m keys:            // overflow", "    split at the median; median moves up to the parent", "    if node was the root: make a new root (height + 1)", "    node = parent"],
    rules: [[/^At \[/, [2]], [/already exists/, [2]], [/into leaf/, [3]], [/new root/, [4, 5, 6]], [/into the parent/, [4, 5, 7]], [/^Empty/, []]],
  },
  bfs: {
    lines: ["BFS(s):", "  mark s seen; dist[s] = 0; queue = [s]", "  while queue is not empty:", "    u = queue.dequeue()", "    for each neighbour v of u:       // alphabetical", "      if v not seen:", "        mark v seen; dist[v] = dist[u] + 1", "        queue.enqueue(v)"],
    rules: [[/^Enqueue the source/, [2]], [/^Dequeue/, [3, 4, 5]], [/^Discover/, [6, 7, 8]], [/^BFS order/, []]],
  },
  dfs: {
    lines: ["DFS(u):", "  mark u visited; d[u] = ++time", "  for each neighbour v of u:         // alphabetical", "    if v not visited: DFS(v)", "  f[u] = ++time                      // finished, backtrack"],
    rules: [[/^Visit/, [2, 3, 4]], [/finished/, [5]], [/^DFS order/, []]],
  },
  dijkstra: {
    lines: ["Dijkstra(s):", "  dist[*] = ∞; dist[s] = 0", "  repeat V times:", "    u = unvisited vertex with the smallest dist", "    mark u done                      // final", "    for each edge (u, v, w):", "      if dist[u] + w < dist[v]:", "        dist[v] = dist[u] + w; prev[v] = u"],
    rules: [[/^dist\(/, [2]], [/^Pick/, [3, 4, 5]], [/^Relax.*update/, [6, 7, 8]], [/^Relax.*keep/, [6, 7]], [/^Final/, []]],
  },
  bellman: {
    lines: ["BellmanFord(s):", "  dist[*] = ∞; dist[s] = 0", "  repeat V − 1 times:", "    for each edge (u, v, w):", "      if dist[u] + w < dist[v]: dist[v] = dist[u] + w", "  for each edge (u, v, w):           // check pass", "    if dist[u] + w < dist[v]: report negative cycle"],
    rules: [[/^dist\(/, [2, 3]], [/^Pass \d+:/, [4, 5]], [/^End of pass/, [3]], [/negative-weight cycle/, [6, 7]], [/^Extra check/, [6, 7]]],
  },
  prim: {
    lines: ["Prim(s):", "  tree = { s }", "  while tree has fewer than V vertices:", "    (u, v) = cheapest edge with u in tree, v outside", "    add v and edge (u, v) to the tree"],
    rules: [[/^Start the tree/, [2]], [/^Cheapest/, [3, 4, 5]], [/^MST weight/, []]],
  },
  kruskal: {
    lines: ["Kruskal():", "  sort edges by weight", "  for each edge (u, v) in that order:", "    if find(u) != find(v):            // different components", "      union(u, v); add edge to the MST", "    else: skip                        // would make a cycle"],
    rules: [[/^Sort edges/, [2]], [/^Take/, [3, 4, 5]], [/^Skip/, [3, 4, 6]], [/^MST weight/, []]],
  },
  topo: {
    lines: ["topoSort():", "  indeg[v] = number of edges into v", "  ready = all v with indeg[v] == 0", "  while ready is not empty:", "    u = smallest vertex in ready; output u", "    for each edge u → v:", "      indeg[v]−−; if indeg[v] == 0: ready.add(v)", "  if output has fewer than V vertices: cycle!"],
    rules: [[/^Count/, [2, 3]], [/^Output/, [4, 5]], [/^Remove edge.*ready/, [6, 7]], [/^Remove edge/, [6, 7]], [/cycle/, [8]], [/^Topological order/, []]],
  },
  merge: {
    lines: ["mergeSort(a, l, r):", "  if l >= r: return", "  m = (l + r) / 2", "  mergeSort(a, l, m)", "  mergeSort(a, m + 1, r)", "  merge(a, l, m, r)   // take the smaller front each time"],
    rules: [[/^Divide/, [1]], [/^Split/, [2, 3, 4, 5]], [/^Merge/, [6]], [/^Sorted with/, []]],
  },
  quick: {
    lines: ["quickSort(a, l, r):", "  if l >= r: return", "  p = a[r]; i = l − 1                // pivot = last", "  for j = l to r − 1:", "    if a[j] <= p: i++; swap(a[i], a[j])", "  swap(a[i + 1], a[r])                // pivot in place", "  quickSort(a, l, i)", "  quickSort(a, i + 2, r)"],
    rules: [[/^Partition/, [2, 3, 4]], [/move it to the left/, [5]], [/^Pivot .* lands/, [6, 7, 8]], [/^Sorted:/, []]],
  },
  insertion: {
    lines: ["insertionSort(a):", "  for i = 1 to n − 1:", "    key = a[i]; j = i − 1", "    while j >= 0 and a[j] > key:", "      a[j + 1] = a[j]; j−−", "    a[j + 1] = key"],
    rules: [[/^Take key/, [2, 3, 4]], [/inserted at index/, [5, 6]], [/^Sorted:/, []]],
  },
  binary: {
    lines: ["binarySearch(a, x):", "  lo = 0; hi = n − 1", "  while lo <= hi:", "    mid = (lo + hi) / 2", "    if a[mid] == x: return mid", "    if a[mid] < x: lo = mid + 1", "    else: hi = mid − 1", "  return −1"],
    rules: [[/= target/, [3, 4, 5]], [/go right/, [3, 4, 6]], [/go left/, [3, 4, 7]], [/not found/, [8]]],
  },
  activity: {
    lines: ["selectActivities(A):", "  sort A by finish time; last = −∞", "  for each activity a in that order:", "    if a.start >= last:", "      take a; last = a.finish", "    else: skip a                      // overlaps"],
    rules: [[/^Sort activities/, [2]], [/take it/, [3, 4, 5]], [/skip/, [3, 4, 6]], [/selected/, []]],
  },
  fknap: {
    lines: ["fractionalKnapsack(items, W):", "  sort items by v / w, highest first", "  for each item:", "    take = min(1, capacityLeft / w)", "    value += take · v", "    capacityLeft −= take · w"],
    rules: [[/^Sort items/, [2]], [/ratio/, [3, 4, 5, 6]], [/^Maximum value/, []]],
  },
  huffman: {
    lines: ["huffman(freq):", "  put every symbol in a min-priority queue", "  while the queue has more than 1 tree:", "    a = extractMin(); b = extractMin()", "    insert node(a.f + b.f, left = a, right = b)", "  codes: left edge = 0, right edge = 1"],
    rules: [[/^Put every/, [2]], [/^Take the two/, [3, 4, 5]], [/^Codes/, [6]]],
  },
  knap01: {
    lines: ["for i = 1 to n:", "  for w = 0 to W:", "    if w_i > w: T[i][w] = T[i−1][w]          // doesn't fit", "    else: T[i][w] = max(T[i−1][w],            // skip", "                        T[i−1][w − w_i] + v_i)  // take", "trace back from T[n][W]"],
    rules: [[/doesn't fit/, [1, 2, 3]], [/max\(skip/, [1, 2, 4, 5]], [/^Best value/, [6]]],
  },
  lcs: {
    lines: ["for i = 1 to m:", "  for j = 1 to n:", "    if X[i] == Y[j]: c[i][j] = c[i−1][j−1] + 1", "    else: c[i][j] = max(c[i−1][j], c[i][j−1])", "trace back from c[m][n]"],
    rules: [[/diagonal/, [1, 2, 3]], [/max\(up/, [1, 2, 4]], [/^LCS length/, [5]]],
  },
  mcm: {
    lines: ["for len = 2 to n:", "  for i = 1 to n − len + 1:", "    j = i + len − 1", "    m[i][j] = min over i ≤ k < j of", "        m[i][k] + m[k+1][j] + p[i−1]·p[k]·p[j]", "answer = m[1][n]"],
    rules: [[/^m\[/, [1, 2, 3, 4, 5]], [/^Minimum scalar/, [6]]],
  },
  fib: {
    lines: ["fib(n):", "  if n < 2: return n", "  return fib(n − 1) + fib(n − 2)"],
    rules: [[/calls? so far/, [1, 2, 3]], [/fib\(/, []]],
  },
  fibMemo: {
    lines: ["fib(n):", "  if n in memo: return memo[n]     // hit", "  if n < 2: return n", "  memo[n] = fib(n − 1) + fib(n − 2)", "  return memo[n]"],
    rules: [[/calls? so far/, [1, 2, 3, 4]], [/fib\(/, [5]]],
  },
};

// linear structures, hashing, tries
Object.assign(PSEUDO, {
  stack: { lines: ["push(x):", "  a[++top] = x", "pop():", "  if top == −1: underflow", "  return a[top−−]", "peek(): return a[top]"],
    rules: [[/^push/, [1, 2]], [/underflow/, [3, 4]], [/^pop/, [3, 5]], [/^peek/, [6]], [/^Popped/, []]] },
  queue: { lines: ["enqueue(x):", "  if size == cap: overflow", "  rear = (front + size) mod cap; a[rear] = x; size++", "dequeue():", "  if size == 0: underflow", "  x = a[front]; front = (front + 1) mod cap; size−−"],
    rules: [[/^enqueue/, [1, 3]], [/overflow/, [1, 2]], [/underflow/, [4, 5]], [/^dequeue/, [4, 6]], [/^Dequeued/, []]] },
  listHead: { lines: ["insertHead(x):", "  node = new Node(x)", "  node.next = head; head = node"], rules: [[/^Create/, [2]], [/newNode.next = head/, [3]], [/^List:/, []]] },
  listTail: { lines: ["insertTail(x):", "  cur = head", "  while cur.next != null: cur = cur.next", "  cur.next = new Node(x)"], rules: [[/^Walk/, [2, 3]], [/^last.next/, [4]], [/^List:/, []]] },
  listInsert: { lines: ["insertAt(pos, x):", "  prev = walk pos − 1 steps from head", "  node.next = prev.next", "  prev.next = node"], rules: [[/^Walk/, [2]], [/prev.next = newNode/, [3, 4]], [/^List:/, []]] },
  listDelete: { lines: ["delete(x):", "  prev = null; cur = head", "  while cur != null and cur.val != x: prev = cur; cur = cur.next", "  if cur == null: return            // not found", "  prev.next = cur.next              // skip cur"], rules: [[/^Compare/, [2, 3]], [/not found/, [4]], [/^Found/, [5]], [/^List:/, []]] },
  listReverse: { lines: ["reverse():", "  prev = null; cur = head", "  while cur != null:", "    next = cur.next; cur.next = prev", "    prev = cur; cur = next", "  head = prev"], rules: [[/^prev = null/, [2]], [/^next = cur.next/, [3, 4, 5]], [/^List:/, [6]]] },
  hashChain: { lines: ["insert(k):", "  i = k mod m", "  table[i].append(k)        // chain"], rules: [[/^h\(/, [2, 3]], [/^Load/, []], [/^Empty/, []]] },
  hashProbe: { lines: ["insert(k):", "  i = k mod m", "  while table[i] is taken: i = (i + 1) mod m", "  table[i] = k"], rules: [[/is taken/, [3]], [/^h\(/, [2, 4]], [/^Load/, []], [/^Empty/, []]] },
  trie: { lines: ["insert(word):", "  node = root", "  for each char c in word:", "    if c not in node.children: create child c", "    node = node.children[c]", "  node.isEnd = true", "search(word): follow each char; found if the path exists and isEnd"],
    rules: [[/create node/, [3, 4, 5]], [/already exists/, [3, 5]], [/^Mark/, [6]], [/search|found|prefix/, [7]], [/^Empty/, [2]]] },
});

// call-stack demos in the recursion lab
const rec = (lines, base, recLines) => ({ lines, rules: [[new RegExp(`^Call \\w+\\(${base}\\)`), [1, 2]], [/^Call/, [1, ...recLines]], [new RegExp(`^Frame \\(${base}\\)`), [2]], [/returns/, [recLines[recLines.length - 1]]], [/^Done/, []]] });
PSEUDO["rec-digits"] = rec(["sumDigits(n):", "  if n == 0: return 0", "  return n % 10 + sumDigits(n / 10)"], 0, [3]);
PSEUDO["rec-fact"] = rec(["factorial(n):", "  if n <= 1: return 1", "  return n * factorial(n − 1)"], 1, [3]);
PSEUDO["rec-print"] = rec(["print(n):", "  if n == 0: return", "  print(n − 1)"], 0, [3]);
PSEUDO["rec-bsearch"] = rec(["search(size n):", "  if n <= 1: return", "  mid = (lo + hi) / 2", "  search one half (size n / 2)"], 1, [3, 4]);

/** Add f.ln (line numbers) to every frame of an algorithm's trace. */
export function annotate(key, frames) {
  const P = PSEUDO[key]; if (!P) return frames;
  for (const f of frames) {
    if (f.ln) continue;
    const en = (f.msg && (f.msg.en || f.msg)) || "";
    const r = P.rules.find(([re]) => re.test(en));
    f.ln = r ? r[1] : [];
  }
  return frames;
}
