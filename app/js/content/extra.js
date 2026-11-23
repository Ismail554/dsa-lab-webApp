// "Beyond the syllabus" lessons (inspired by the wider Algo Lab catalogue): stacks & queues, linked lists,
// hashing, tries, topological sort. Same format as curriculum.js; each one opens with a story.

const mcq = (q, options, answer, why) => ({ type: "mcq", q, options, answer, why });
const inp = (q, fields, why, hint) => ({ type: "input", q, fields, why, hint });
const F = (label, ans, kind, o = {}) => ({ label, ans, kind, ...o });

export const EXTRA_SET = { id: "extra", code: "Extra", title: { en: "Beyond the syllabus: everyday structures", bn: "সিলেবাসের বাইরে: রোজকার data structure" }, sources: [] };

export const EXTRA_TOPICS = [
  {
    id: "stackqueue", set: "extra", minutes: 10, level: "Beginner", prereq: ["analysis"], pos: [0, 3.7], labs: ["linear"],
    title: { en: "Stacks & Queues", bn: "Stack ও Queue" },
    summary: { en: "LIFO vs FIFO: push/pop on a stack, enqueue/dequeue on a circular queue — all O(1).", bn: "LIFO বনাম FIFO: stack এ push/pop, circular queue তে enqueue/dequeue — সব O(1)।" },
    learn: [{ en: "Stack = last in, first out", bn: "Stack = শেষে ঢুকলে আগে বের" }, { en: "Queue = first in, first out", bn: "Queue = আগে ঢুকলে আগে বের" }, { en: "Circular queue with mod", bn: "mod দিয়ে circular queue" }],
    formulas: [{ id: "cq", tex: "\\text{rear}=(\\text{front}+\\text{size})\\bmod \\text{cap}", name: { en: "Circular queue rear index", bn: "Circular queue এর rear index" } }],
    steps: [
      { tag: "visual", title: { en: "Push and pop", bn: "Push আর pop" },
        body: { en: "Run **push 5, push 3, push 8, pop, peek, push 1, pop, pop**. Every operation touches only the **top**, so each is O(1). The pops come out 8, 1, 3 — the reverse of arrival.", bn: "চালাও **push 5, push 3, push 8, pop, peek, push 1, pop, pop**। প্রতিটা operation শুধু **top** ছোঁয়, তাই O(1)। Pop হয় 8, 1, 3 — আসার উল্টো ক্রমে।" },
        key: { en: "Stack = LIFO. Undo, the call stack and DFS all use one.", bn: "Stack = LIFO। Undo, call stack, DFS — সবাই এটা ব্যবহার করে।" },
        lab: { id: "linear", preset: { mode: "stack" } },
        ask: inp({ en: "push 1, push 2, push 3, pop, push 4, pop, pop. Which values were popped, in order?", bn: "push 1, push 2, push 3, pop, push 4, pop, pop। কোন মানগুলো কোন ক্রমে pop হলো?" }, [F("popped", "3, 4, 2", "seq")], { en: "3 (top), then 4, then 2.", bn: "3 (top), তারপর 4, তারপর 2।" }) },
      { tag: "visual", title: { en: "A queue that wraps around", bn: "যে queue ঘুরে আসে" },
        body: { en: "A queue removes from the **front** and adds at the **rear**. In a plain array the front keeps moving right and wastes space; a **circular** queue computes rear = (front + size) mod cap, so the array wraps around.", bn: "Queue **front** থেকে সরায় আর **rear** এ যোগ করে। সাধারণ array তে front ডানে সরতে থাকে, জায়গা নষ্ট হয়; **circular** queue তে rear = (front + size) mod cap, তাই array ঘুরে শুরুতে আসে।" },
        key: { en: "Queue = FIFO; circular indexing keeps both operations O(1).", bn: "Queue = FIFO; circular index দুটো operation কেই O(1) রাখে।" },
        lab: { id: "linear", preset: { mode: "queue" } },
        ask: inp({ en: "Circular queue, cap = 5, front = 3, size = 4. At which index does the next enqueue go?", bn: "Circular queue, cap = 5, front = 3, size = 4। পরের enqueue কোন index এ যাবে?" }, [F("rear", "2", "num")], { en: "(3 + 4) mod 5 = 2.", bn: "(3 + 4) mod 5 = 2।" }) },
    ],
    feynman: { prompt: { en: "Explain the difference between a stack and a queue using a pile of plates and a bus queue, and say why both operations are O(1).", bn: "প্লেটের স্তূপ আর বাসের লাইন দিয়ে stack ও queue এর পার্থক্য বোঝাও, আর বলো কেন দুটো operation O(1)।" },
      keywords: [["lifo", "last in", "শেষে"], ["fifo", "first in", "আগে"], ["top", "push", "pop"], ["front", "rear", "enqueue", "dequeue"], ["o(1)", "constant"]] },
  },
  {
    id: "linkedlist", set: "extra", minutes: 10, level: "Beginner", prereq: ["stackqueue"], pos: [1, 3.7], labs: ["linear"],
    title: { en: "Linked Lists", bn: "Linked List" },
    summary: { en: "Nodes that point to the next node: O(1) insert at the head, O(n) to reach the i-th item, reverse in place.", bn: "যে node পরের node এর দিকে নির্দেশ করে: head এ insert O(1), i-তম item পেতে O(n), in-place reverse।" },
    learn: [{ en: "Nodes and next pointers", bn: "Node আর next pointer" }, { en: "Insert and delete by re-linking", bn: "Link বদলে insert ও delete" }, { en: "Reversing a list", bn: "List উল্টানো" }],
    formulas: [{ id: "ll", tex: "\\text{insertHead}=O(1),\\ \\text{access}(i)=O(n),\\ \\text{reverse}=O(n)\\ \\text{time},\\ O(1)\\ \\text{space}", name: { en: "Linked list costs", bn: "Linked list এর খরচ" } }],
    steps: [
      { tag: "visual", title: { en: "Delete by skipping", bn: "এড়িয়ে গিয়ে delete" },
        body: { en: "To delete a node, walk with **prev** and **cur** until cur holds the value, then set **prev.next = cur.next**. Nothing moves in memory — one arrow changes.", bn: "একটা node মুছতে **prev** আর **cur** নিয়ে হাঁটো যতক্ষণ না cur এ মানটা পাও, তারপর **prev.next = cur.next**। Memory তে কিছু সরে না — শুধু একটা তীর বদলায়।" },
        key: { en: "Linked lists change links, arrays shift elements.", bn: "Linked list link বদলায়, array element সরায়।" },
        lab: { id: "linear", preset: { mode: "list", lop: "delete", lx: 30, list: [10, 20, 30, 40] } },
        ask: mcq({ en: "Time to insert a new node at the head?", bn: "Head এ নতুন node insert করতে কত সময়?" }, ["$O(1)$", "$O(\\log n)$", "$O(n)$"], 0, { en: "Two pointer assignments.", bn: "দুটো pointer assignment।" }) },
      { tag: "visual", title: { en: "Reverse with three pointers", bn: "তিনটা pointer দিয়ে উল্টানো" },
        body: { en: "Keep **prev**, **cur**, **next**. For each node: remember next, point cur back to prev, then slide prev and cur one step. At the end, head = prev. O(n) time, O(1) extra space.", bn: "**prev**, **cur**, **next** রাখো। প্রতিটা node এ: next মনে রাখো, cur কে prev এর দিকে ঘোরাও, তারপর prev ও cur এক ধাপ এগোও। শেষে head = prev। O(n) সময়, O(1) অতিরিক্ত জায়গা।" },
        key: { en: "Save next before you overwrite cur.next.", bn: "cur.next বদলানোর আগে next সেভ করো।" },
        lab: { id: "linear", preset: { mode: "list", lop: "reverse", list: [10, 20, 30, 40] } },
        ask: inp({ en: "Reverse 1 → 2 → 3 → 4 → 5. What is the new list?", bn: "1 → 2 → 3 → 4 → 5 উল্টাও। নতুন list কী?" }, [F("list", "5 4 3 2 1", "seq")], { en: "5 → 4 → 3 → 2 → 1.", bn: "5 → 4 → 3 → 2 → 1।" }) },
    ],
    feynman: { prompt: { en: "Explain why inserting at the front of a linked list is O(1) but at the front of an array is O(n).", bn: "বোঝাও: linked list এর সামনে insert কেন O(1), কিন্তু array এর সামনে কেন O(n)।" },
      keywords: [["pointer", "next", "link"], ["shift", "move", "সরাতে"], ["o(1)"], ["o(n)"], ["head"]] },
  },
  {
    id: "hashing", set: "extra", minutes: 12, level: "Intermediate", prereq: ["stackqueue"], pos: [2, 3.7], labs: ["linear"],
    title: { en: "Hash Tables & Collisions", bn: "Hash Table ও Collision" },
    summary: { en: "h(k) = k mod m sends a key straight to a slot: O(1) on average. Collisions are handled by chaining or linear probing.", bn: "h(k) = k mod m key কে সরাসরি একটা ঘরে পাঠায়: গড়ে O(1)। Collision সামলায় chaining বা linear probing।" },
    learn: [{ en: "Hash functions", bn: "Hash function" }, { en: "Chaining", bn: "Chaining" }, { en: "Linear probing", bn: "Linear probing" }, { en: "Load factor", bn: "Load factor" }],
    formulas: [{ id: "h", tex: "h(k)=k\\bmod m,\\qquad \\alpha=\\frac{n}{m}", name: { en: "Division hashing & load factor", bn: "Division hashing ও load factor" } }, { id: "probe", tex: "h_i(k)=(h(k)+i)\\bmod m", name: { en: "Linear probing", bn: "Linear probing" } }],
    steps: [
      { tag: "visual", title: { en: "Chaining", bn: "Chaining" },
        body: { en: "Insert 10, 22, 31, 4, 15, 28, 17 with m = 7. 10 and 31 both give 3 — a **collision**. With chaining each slot keeps a small list, so 31 joins 10's chain. Search costs O(1 + α) on average.", bn: "m = 7 এ 10, 22, 31, 4, 15, 28, 17 insert করো। 10 আর 31 দুটোই 3 দেয় — **collision**। Chaining এ প্রতিটা ঘরে ছোট list থাকে, তাই 31, 10 এর chain এ যোগ হয়। গড়ে search O(1 + α)।" },
        key: { en: "Collisions are normal; the table design decides how to handle them.", bn: "Collision স্বাভাবিক; table এর নকশা ঠিক করে কীভাবে সামলাবে।" },
        lab: { id: "linear", preset: { mode: "hash", hmode: "chain" } },
        ask: inp({ en: "m = 7. Which slot does key 45 go to?", bn: "m = 7। Key 45 কোন ঘরে যাবে?" }, [F("slot", "3", "num")], { en: "45 mod 7 = 3.", bn: "45 mod 7 = 3।" }) },
      { tag: "visual", title: { en: "Linear probing", bn: "Linear probing" },
        body: { en: "No lists: if slot h(k) is taken, try h(k)+1, h(k)+2 … (mod m). With the same keys, 17 hashes to 3 but slots 3, 4, 5 are taken, so it lands in 6. As α → 1, these runs get long and slow.", bn: "List নেই: h(k) ঘর ভরা থাকলে h(k)+1, h(k)+2 … (mod m) চেষ্টা করো। একই key তে 17 এর hash 3, কিন্তু 3, 4, 5 ভরা, তাই 6 এ বসে। α → 1 হলে এই সারিগুলো লম্বা আর ধীর হয়।" },
        key: { en: "Keep α low (resize when it grows) to stay near O(1).", bn: "α কম রাখো (বেড়ে গেলে resize) — তাহলে O(1) এর কাছে থাকবে।" },
        lab: { id: "linear", preset: { mode: "hash", hmode: "probe" } },
        ask: inp({ en: "m = 7, linear probing, insert 10, 17, 24 in that order. Which slot does 24 land in?", bn: "m = 7, linear probing, ক্রমে 10, 17, 24 insert। 24 কোন ঘরে বসে?" }, [F("slot", "5", "num")], { en: "All hash to 3: 10→3, 17→4, 24→5.", bn: "সবার hash 3: 10→3, 17→4, 24→5।" }) },
    ],
    feynman: { prompt: { en: "Explain how a hash table finds a key in O(1) on average, and what happens on a collision.", bn: "বোঝাও: hash table কীভাবে গড়ে O(1) এ key খুঁজে পায়, আর collision হলে কী হয়।" },
      keywords: [["hash", "mod", "h(k)"], ["collision", "same slot", "একই ঘর"], ["chain", "list"], ["probe", "next slot", "পরের ঘর"], ["load factor", "α", "alpha", "resize"]] },
  },
  {
    id: "trie", set: "extra", minutes: 9, level: "Intermediate", prereq: ["trees"], pos: [3, 3.7], labs: ["linear"],
    title: { en: "Tries (Prefix Trees)", bn: "Trie (Prefix Tree)" },
    summary: { en: "A tree of letters: words with the same prefix share a path. Insert and search cost O(L) for a word of length L.", bn: "অক্ষরের tree: একই prefix এর শব্দগুলো পথ ভাগ করে। L দৈর্ঘ্যের শব্দে insert ও search O(L)।" },
    learn: [{ en: "Shared prefixes", bn: "ভাগ করা prefix" }, { en: "End-of-word marks", bn: "শব্দের শেষের চিহ্ন" }, { en: "Prefix search", bn: "Prefix search" }],
    formulas: [{ id: "trie", tex: "\\text{insert}/\\text{search}=O(L)", name: { en: "Trie cost (L = word length)", bn: "Trie এর খরচ (L = শব্দের দৈর্ঘ্য)" } }],
    steps: [
      { tag: "visual", title: { en: "Words share their beginnings", bn: "শব্দগুলো শুরুটা ভাগ করে" },
        body: { en: "Insert car, cat, cart, dog, do. \"car\" and \"cat\" share c → a; \"cart\" reuses c → a → r. Green nodes end a word. Searching \"ca\" follows the path but finds no end mark — it is only a **prefix**.", bn: "car, cat, cart, dog, do insert করো। \"car\" আর \"cat\" c → a ভাগ করে; \"cart\" c → a → r আবার ব্যবহার করে। সবুজ node শব্দের শেষ। \"ca\" খুঁজলে পথ পাওয়া যায় কিন্তু শেষ চিহ্ন নেই — এটা শুধু একটা **prefix**।" },
        key: { en: "The cost depends on the word's length, not on how many words are stored.", bn: "খরচ শব্দের দৈর্ঘ্যের উপর নির্ভর করে, কতগুলো শব্দ আছে তার উপর না।" },
        lab: { id: "linear", preset: { mode: "trie" } },
        ask: inp({ en: "How many nodes (including the root) in a trie holding \"to\", \"tea\", \"ten\"?", bn: "\"to\", \"tea\", \"ten\" রাখা trie তে মোট কয়টা node (root সহ)?" }, [F("nodes", "6", "num")], { en: "root, t, o, e, a, n = 6.", bn: "root, t, o, e, a, n = 6।" }) },
    ],
    feynman: { prompt: { en: "Explain how a phone keyboard could use a trie to suggest words as you type.", bn: "বোঝাও: ফোনের keyboard টাইপ করার সময় trie দিয়ে কীভাবে শব্দ সাজেস্ট করতে পারে।" },
      keywords: [["prefix", "শুরু"], ["letter", "character", "char", "অক্ষর"], ["share", "path", "পথ"], ["end", "mark", "শেষ"], ["o(l)", "length", "দৈর্ঘ্য"]] },
  },
  {
    id: "topo", set: "extra", minutes: 9, level: "Intermediate", prereq: ["bfsdfs"], pos: [4, 3.7], labs: ["graph"],
    title: { en: "Topological Sort", bn: "Topological Sort" },
    summary: { en: "Order the tasks of a DAG so every edge points forward: repeatedly take a vertex with in-degree 0 (Kahn).", bn: "DAG এর কাজগুলো এমনভাবে সাজাও যেন প্রতিটা edge সামনের দিকে যায়: বারবার in-degree 0 এর vertex নাও (Kahn)।" },
    learn: [{ en: "DAGs and dependencies", bn: "DAG আর নির্ভরতা" }, { en: "In-degree", bn: "In-degree" }, { en: "Kahn's algorithm", bn: "Kahn এর algorithm" }],
    formulas: [{ id: "topo", tex: "u\\to v\\ \\Rightarrow\\ u\\ \\text{before}\\ v,\\qquad O(V+E)", name: { en: "Topological order", bn: "Topological ক্রম" } }],
    steps: [
      { tag: "visual", title: { en: "Start with what depends on nothing", bn: "যেটা কারো উপর নির্ভর করে না, সেটা আগে" },
        body: { en: "Count each vertex's **in-degree** (edges coming in). Vertices with in-degree 0 are ready. Output the smallest ready one, delete its outgoing edges, and any vertex that drops to 0 becomes ready. If some vertex never becomes ready, there is a **cycle**.", bn: "প্রতিটা vertex এর **in-degree** (ঢোকা edge) গোনো। In-degree 0 মানে ready। সবচেয়ে ছোট ready টা output করো, তার বের হওয়া edge মুছে দাও, আর যার in-degree 0 হয় সে ready। কেউ কখনো ready না হলে **cycle** আছে।" },
        key: { en: "Only a DAG (directed, acyclic) has a topological order.", bn: "শুধু DAG (directed, cycle নেই) এর topological ক্রম থাকে।" },
        lab: { id: "graph", preset: { algo: "topo", g: "directed" } },
        ask: inp({ en: "Topological order of the lab's directed graph (smallest ready vertex first)?", bn: "ল্যাবের directed graph এর topological ক্রম (ready এর মধ্যে ছোটটা আগে)?" }, [F("order", "A C B D E F", "seq")], { en: "A; then C (B still waits for C); B; D; E; F.", bn: "A; তারপর C (B তখনো C এর অপেক্ষায়); B; D; E; F।" }) },
    ],
    feynman: { prompt: { en: "Explain topological sort using course prerequisites: which course can you take first, and how do you continue?", bn: "কোর্সের prerequisite দিয়ে topological sort বোঝাও: প্রথমে কোন কোর্স নেওয়া যায়, তারপর কীভাবে এগোবে?" },
      keywords: [["in-degree", "indegree", "prerequisite", "depend"], ["zero", "0", "ready"], ["remove", "delete", "edge"], ["cycle", "dag"], ["order", "before", "আগে"]] },
  },
];

const ask = mcq;
export const EXTRA_STORIES = {
  stackqueue: {
    title: { en: "Story: plates at a wedding and the bus queue", bn: "গল্প: বিয়েবাড়ির প্লেট আর বাসের লাইন" },
    body: { en: "At a wedding feast the waiter stacks clean plates; guests always take the plate on **top** — the last one washed is the first one used. Outside, people wait for the bus in a **line**: whoever came first boards first. One pile, one line — the whole difference between a stack and a queue.", bn: "বিয়েবাড়িতে বেয়ারা পরিষ্কার প্লেট স্তূপ করে রাখে; অতিথিরা সবসময় **উপরের** প্লেটটা নেয় — যেটা শেষে ধোয়া হয়েছে সেটাই আগে ব্যবহার হয়। বাইরে মানুষ বাসের জন্য **লাইনে** দাঁড়ায়: যে আগে এসেছে সে আগে ওঠে। একটা স্তূপ, একটা লাইন — stack আর queue এর পুরো পার্থক্য এটাই।" },
    ask: ask({ en: "The browser's Back button returns to the most recent page first. Stack or queue?", bn: "Browser এর Back বাটন সবচেয়ে সাম্প্রতিক পেজে আগে ফেরে। Stack না queue?" }, ["Stack", "Queue"], 0, { en: "Most recent first = LIFO = stack.", bn: "সাম্প্রতিকটা আগে = LIFO = stack।" }),
  },
  linkedlist: {
    title: { en: "Story: the treasure hunt clues", bn: "গল্প: গুপ্তধন খোঁজার চিরকুট" },
    body: { en: "In a school treasure hunt each clue says only where the **next** clue is hidden. To reach clue 5 you must follow clues 1, 2, 3, 4 — there is no shortcut. But adding a new first clue is easy: write it, point it to the old first clue, done. Removing a clue just means the clue before it now points past it.", bn: "স্কুলের গুপ্তধন খেলায় প্রতিটা চিরকুট শুধু বলে **পরের** চিরকুট কোথায়। ৫ নম্বরে পৌঁছাতে ১, ২, ৩, ৪ ধরে যেতে হবে — কোনো শর্টকাট নেই। কিন্তু নতুন প্রথম চিরকুট যোগ করা সহজ: লিখো, পুরোনো প্রথমটার দিকে নির্দেশ করো, শেষ। একটা চিরকুট বাদ দিতে আগেরটাকে শুধু তার পরেরটার দিকে নির্দেশ করাও।" },
    ask: ask({ en: "To read clue 50, how many clues must you follow first?", bn: "৫০ নম্বর চিরকুট পড়তে আগে কয়টা চিরকুট ধরে যেতে হবে?" }, ["1", "49", "50"], 1, { en: "Access is a walk: O(n).", bn: "Access মানে হাঁটা: O(n)।" }),
  },
  hashing: {
    title: { en: "Story: the post office pigeonholes", bn: "গল্প: পোস্ট অফিসের খোপ" },
    body: { en: "A post office has 7 pigeonholes. The clerk puts each letter in hole **(house number mod 7)** — no searching, he goes straight there. Sometimes two letters want the same hole (a **collision**). One clerk bundles them together in that hole (**chaining**); another clerk puts the second letter in the next empty hole (**linear probing**).", bn: "একটা পোস্ট অফিসে ৭টা খোপ। ক্লার্ক প্রতিটা চিঠি রাখেন **(বাড়ির নম্বর mod 7)** নম্বর খোপে — খুঁজতে হয় না, সরাসরি যান। কখনো দুটো চিঠি একই খোপ চায় (**collision**)। একজন ক্লার্ক সেগুলো একই খোপে বেঁধে রাখেন (**chaining**); আরেকজন দ্বিতীয়টা পরের খালি খোপে রাখেন (**linear probing**)।" },
    ask: ask({ en: "House number 23, 7 holes. Which hole?", bn: "বাড়ির নম্বর ২৩, খোপ ৭টা। কোন খোপ?" }, ["2", "3", "23"], 0, { en: "23 mod 7 = 2.", bn: "23 mod 7 = 2।" }),
  },
  trie: {
    title: { en: "Story: the dictionary's thumb tabs", bn: "গল্প: অভিধানের অক্ষর-ট্যাব" },
    body: { en: "A Bangla–English dictionary has tabs: first pick the letter tab, then the next letter, then the next. Words that start the same way — car, cat, cart — live on the same path of tabs until they differ. Finding a word takes as many steps as it has letters, whether the dictionary holds a hundred words or a million.", bn: "বাংলা–ইংরেজি অভিধানে ট্যাব থাকে: আগে প্রথম অক্ষরের ট্যাব, তারপর পরের অক্ষর, তারপর তার পরের। একইভাবে শুরু হওয়া শব্দ — car, cat, cart — আলাদা হওয়া পর্যন্ত একই পথে থাকে। শব্দ খুঁজতে যতগুলো অক্ষর ততগুলো ধাপ — অভিধানে শ'খানেক শব্দ থাকুক বা দশ লাখ।" },
    ask: ask({ en: "Finding \"cart\" takes about how many steps?", bn: "\"cart\" খুঁজতে প্রায় কয় ধাপ?" }, ["4", "log₂(number of words)", "number of words"], 0, { en: "One step per letter: O(L).", bn: "প্রতি অক্ষরে এক ধাপ: O(L)।" }),
  },
  topo: {
    title: { en: "Story: getting dressed in the right order", bn: "গল্প: ঠিক ক্রমে জামাকাপড় পরা" },
    body: { en: "You can't wear shoes before socks, or a tie before a shirt. Write each item and draw an arrow \"must come before\". Start with anything that has no arrow coming in (socks, shirt), put it on, and erase its arrows — now new items are free. Keep going. If two items each need the other first, you are stuck: a **cycle**.", bn: "মোজার আগে জুতা, বা শার্টের আগে টাই পরা যায় না। প্রতিটা জিনিস লিখো আর \"আগে আসতে হবে\" তীর আঁকো। যার দিকে কোনো তীর আসেনি (মোজা, শার্ট) সেটা আগে পরো, তার তীর মুছে দাও — এখন নতুন জিনিস মুক্ত। এভাবে চলো। দুটো জিনিস যদি একে অপরকে আগে চায়, তুমি আটকে গেছ: একটা **cycle**।" },
    ask: ask({ en: "Which item can you put on first?", bn: "কোনটা সবার আগে পরা যায়?" }, [{ en: "Shoes", bn: "জুতা" }, { en: "Socks", bn: "মোজা" }, { en: "Tie", bn: "টাই" }], 1, { en: "Nothing points into socks: in-degree 0.", bn: "মোজার দিকে কোনো তীর নেই: in-degree 0।" }),
  },
};
