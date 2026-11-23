import growth from "./growth.js";
import recursion from "./recursion.js";
import heap from "./heap.js";
import avl from "./avl.js";
import btree from "./btree.js";
import graph from "./graph.js";
import sort from "./sort.js";
import greedy from "./greedy.js";
import dp from "./dp.js";
import linear from "./linear.js";

export const LABS = [growth, recursion, linear, heap, avl, btree, graph, sort, greedy, dp];
export const labById = (id) => LABS.find((l) => l.id === id);
