import fs from "node:fs";
import path from "node:path";
import bibtexParse from "bibtex-parse-js";

const root = process.cwd();
const inFile = path.join(root, "src", "data", "publications.bib");
const outDir = path.join(root, "public", "cite");

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function safeFilename(s) {
  return String(s || "ref")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "_");
}

function entryToBib(e) {
  const type = (e.entryType || "article").toLowerCase();
  const key = e.citationKey || "ref";
  const tags = e.entryTags || {};

  const lines = Object.entries(tags)
    .filter(([k, v]) => v !== undefined && v !== null && String(v).trim() !== "")
    .map(([k, v]) => {
      const val = String(v).replace(/\s+/g, " ").trim();
      return `  ${k} = {${val}}`;
    });

  return `@${type}{${key},\n${lines.join(",\n")}\n}\n`;
}

function main() {
  if (!fs.existsSync(inFile)) {
    console.error(`Missing input file: ${inFile}`);
    process.exit(1);
  }

  const bibRaw = fs.readFileSync(inFile, "utf-8");
  const parsed = bibtexParse.toJSON(bibRaw);

  ensureDir(outDir);

  let written = 0;
  for (const e of parsed) {
    const key = e.citationKey;
    if (!key) continue;

    const filename = `${safeFilename(key)}.bib`;
    const outFile = path.join(outDir, filename);
    fs.writeFileSync(outFile, entryToBib(e), "utf-8");
    written++;
  }

  // Optional: also expose the full bib for download
  fs.copyFileSync(inFile, path.join(root, "public", "publications.bib"));

  console.log(`Generated ${written} per-entry BibTeX files in ${outDir}`);
}

main();
