/**
 * Verifies that every locale bundle exports exactly the same key set as the
 * English reference bundle, and that the composed export includes every part.
 *
 * Usage: node scripts/check-dict.mjs
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), "lib", "i18n");

function parseKeys(file) {
  const src = readFileSync(file, "utf8");
  const keys = new Set();
  // Only count top-level dictionary literals: two-space indented keys.
  for (const m of src.matchAll(/^ {2}"([^"]+)":/gm)) keys.add(m[1]);
  return keys;
}

function parseParts(file) {
  const src = readFileSync(file, "utf8");
  const parts = [...src.matchAll(/^const (\w+) = \{/gm)].map((m) => m[1]);
  const merged = [...src.matchAll(/^ {2}\.\.\.(\w+),/gm)].map((m) => m[1]);
  return { parts, merged };
}

const files = readdirSync(dir).filter(
  // Only the four translation bundles — `index.ts` / `keys.ts` are helpers.
  (f) => /^(ar|en|fr|es)\.ts$/.test(f),
);
const reference = parseKeys(join(dir, "en.ts"));

let failed = false;

console.log(`reference (en.ts): ${reference.size} keys\n`);

for (const file of files) {
  const full = join(dir, file);
  const { parts, merged } = parseParts(full);
  const keys = parseKeys(full);

  const unmerged = parts.filter((p) => !merged.includes(p));
  const extra = [...keys].filter((k) => !reference.has(k));
  const missing = [...reference].filter((k) => !keys.has(k));
  const dupes = [...keys].length !== keys.size;

  const status = extra.length || missing.length || unmerged.length ? "FAIL" : "ok";
  if (status === "FAIL") failed = true;

  console.log(`${file.padEnd(8)} ${status.padEnd(5)} keys=${keys.size} parts=${parts.length} merged=${merged.length}`);
  if (unmerged.length) console.log(`   ! parts never merged: ${unmerged.join(", ")}`);
  if (extra.length) console.log(`   ! ${extra.length} key(s) not in reference: ${extra.slice(0, 8).join(", ")}`);
  if (missing.length) console.log(`   ! ${missing.length} missing key(s): ${missing.slice(0, 8).join(", ")}`);
  if (dupes) console.log("   ! duplicate keys present");
}

process.exit(failed ? 1 : 0);