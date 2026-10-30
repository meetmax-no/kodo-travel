#!/usr/bin/env node
// i18n-sperre: feiler build hvis paritet brytes eller UI-tekst er hardkodet.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
// TypeScript-parseren (allerede devDependency i Next-prosjektet) — leser JSX
// som tre, så linjeskift og plassering på linja ikke avgjør om tekst fanges.
import ts from "typescript";

// ─── CONFIG (juster per prosjekt) ───────────────────────────────────────────
const LOCALES = ["lib/locales/no.json", "lib/locales/en.json"]; // kanonisk = [0]
const ROOTS = ["app", "components"];        // hvor .tsx skannes
const SKIP = new Set([]);                    // midlertidige unntak, f.eks. "app/page.tsx"
const OK = "i18n-ok";                        // suppress-markør på en linje
const NATIVE = /[æøåÆØÅ]/;                    // språk-spesifikke tegn (norsk her)
// ────────────────────────────────────────────────────────────────────────────

const ATTRS = new Set(["aria-label", "placeholder", "title"]);

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

// Teksten i en streng-/template-literal (uten ${…}-uttrykkene), ellers null.
function literalText(node) {
  if (!node) return null;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isTemplateExpression(node))
    return [node.head.text, ...node.templateSpans.map((s) => s.literal.text)].join(" ");
  return null;
}

// Navnet på funksjonen som kalles: t(…) → "t", i18n.t(…) → "t", console.log(…) → "log".
function calleeName(call) {
  const e = call.expression;
  if (ts.isIdentifier(e)) return e.text;
  if (ts.isPropertyAccessExpression(e)) return e.name.text;
  return null;
}

// Strenger som ikke er UI-tekst: t()-nøkler, console.*, modulstier, typer og egenskapsnavn.
function exempt(node) {
  const p = node.parent;
  if (ts.isCallExpression(p) && p.arguments.includes(node) && calleeName(p) === "t") return true;
  if ((ts.isImportDeclaration(p) || ts.isExportDeclaration(p)) && p.moduleSpecifier === node) return true;
  if (ts.isLiteralTypeNode(p)) return true;
  if ("name" in p && p.name === node) return true; // { "nøkkel": … }
  for (let a = p; a; a = a.parent) {
    if (ts.isCallExpression(a) && ts.isPropertyAccessExpression(a.expression)
        && ts.isIdentifier(a.expression.expression) && a.expression.expression.text === "console")
      return true;
  }
  return false;
}

const hits = [];
for (const file of files) {
  if (SKIP.has(file.split("\\").join("/"))) continue;
  const src = readFileSync(file, "utf8");
  const lines = src.split("\n");
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  // pos = første tegn i teksten (ikke innrykk/linjeskift foran).
  const hit = (pos, why, text) => {
    const line = sf.getLineAndCharacterOfPosition(pos).line;
    if (lines[line].includes(OK)) return;
    hits.push({ file, line: line + 1, why, text: text.replace(/\s+/g, " ").trim().slice(0, 60) });
  };

  const reported = new Set(); // literaler som allerede er meldt som attributt
  const visit = (node) => {
    // JSX-tekst mellom tagger, uansett hvor på linja den står.
    if (ts.isJsxText(node) && NATIVE.test(node.text)) {
      const raw = src.slice(node.pos, node.end);
      hit(node.pos + raw.length - raw.trimStart().length, "JSX-tekst", node.text);
    }
    // aria-label / placeholder / title = "…" eller {"…"} — all tekst, ikke bare æøå.
    if (ts.isJsxAttribute(node) && ATTRS.has(node.name.getText(sf)) && node.initializer) {
      const init = node.initializer;
      const value = ts.isJsxExpression(init) ? init.expression : init;
      const text = literalText(value);
      if (text != null && text.trim() !== "") {
        reported.add(value);
        hit(node.getStart(sf), "attributt", node.getText(sf));
      }
    }
    // Strenger med språk-spesifikke tegn hvor som helst ellers: {"…"}, {x ? "…" : "…"},
    // setError("…"), `Hei ${navn}` osv.
    const text = literalText(node);
    if (text != null && NATIVE.test(text) && !reported.has(node) && !exempt(node))
      hit(node.getStart(sf), "streng", node.getText(sf));
    ts.forEachChild(node, visit);
  };
  visit(sf);
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
