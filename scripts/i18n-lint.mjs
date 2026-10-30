#!/usr/bin/env node
// i18n-sperre: feiler build hvis paritet brytes eller UI-tekst er hardkodet.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

// ─── CONFIG (juster per prosjekt) ───────────────────────────────────────────
const LOCALES = ["lib/locales/no.json", "lib/locales/en.json"]; // kanonisk = [0]
const ROOTS = ["app", "components"];        // hvor .tsx skannes
const SKIP = new Set([]);                    // midlertidige unntak, f.eks. "app/page.tsx"
const OK = "i18n-ok";                        // suppress-markør på en linje
const NATIVE = /[æøåÆØÅ]/;                    // språk-spesifikke tegn (norsk her)
// ────────────────────────────────────────────────────────────────────────────

const ATTR = /\b(aria-label|placeholder|title)\s*=\s*"([^"{}]*[^\s"{}][^"{}]*)"/;
const JSX_NATIVE = new RegExp(`^[A-Za-zÆØÅæøå][^<>={}();]*${NATIVE.source}`);

const problems = [];

// Sjekk 1: paritet mellom språkfilene.
try {
  const maps = LOCALES.map((f) => JSON.parse(readFileSync(f, "utf8")));
  const canon = Object.keys(maps[0]);
  maps.forEach((m, i) => {
    if (i === 0) return;
    const missing = canon.filter((k) => !(k in m));
    const extra = Object.keys(m).filter((k) => !(k in maps[0]));
    if (missing.length || extra.length)
      problems.push(
        `Paritet brutt (${LOCALES[i]}): ${missing.length} mangler (${missing
          .slice(0, 5)
          .join(", ")}…), ${extra.length} kun her (${extra.slice(0, 5).join(", ")}…)`,
      );
  });
} catch (e) {
  problems.push(`Kunne ikke lese locale-filene: ${e.message}`);
}

// Sjekk 2: hardkodet UI-tekst i .tsx.
function walk(dir, out) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith(".tsx")) out.push(p);
  }
}
const files = [];
for (const r of ROOTS) {
  try { walk(r, files); } catch { /* mangler */ }
}

const hits = [];
for (const file of files) {
  if (SKIP.has(file.split("\\").join("/"))) continue;
  let block = false;
  readFileSync(file, "utf8").split("\n").forEach((raw, i) => {
    const line = raw.trim();
    if (block) { if (line.includes("*/")) block = false; return; }
    if (line.startsWith("/*")) { if (!line.includes("*/")) block = true; return; }
    if (line.startsWith("//") || line.startsWith("*") || line.includes(OK)) return;
    const a = ATTR.exec(raw);
    if (a) hits.push({ file, line: i + 1, why: "attributt", text: a[0].trim() });
    if (!raw.includes("t(") && JSX_NATIVE.test(line))
      hits.push({ file, line: i + 1, why: "JSX-tekst", text: line.slice(0, 60) });
  });
}

if (problems.length || hits.length) {
  console.error("\n✖ i18n-sperre feilet:\n");
  for (const p of problems) console.error(`  • ${p}`);
  if (hits.length) {
    console.error(`  • ${hits.length} hardkodet UI-streng(er) — bruk t():`);
    for (const h of hits) console.error(`      ${h.file}:${h.line} [${h.why}] ${h.text}`);
    console.error(`\n  (Bevisst literal? Legg «${OK}» på linja.)`);
  }
  console.error("");
  process.exit(1);
}
console.log(`✓ i18n-sperre: paritet OK + ${files.length} filer uten hardkodet UI-tekst.`);
