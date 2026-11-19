import { cpSync, copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const root = process.cwd();
const app = join(root, "app");
const katexSource = join(root, "node_modules", "katex", "dist");
const katexTarget = join(app, "vendor", "katex");
const pdfSource = join(root, "node_modules", "pdfjs-dist", "build");
const pdfTarget = join(app, "vendor", "pdfjs");

cpSync(katexSource, katexTarget, { recursive: true });
for (const file of ["pdf.min.mjs", "pdf.mjs", "pdf.worker.min.mjs"]) {
  const target = join(pdfTarget, file);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(join(pdfSource, file), target);
}
