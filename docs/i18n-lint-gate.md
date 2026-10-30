# i18n-sperre (lint-gate) — mal for nye prosjekter

En liten **build-sperre** uten ekstra avhengigheter (bruker `typescript`, som
Next-prosjektet allerede har) som feiler før hver `next build` hvis
noen har (a) brutt paritet mellom språkfilene, eller (b) hardkodet synlig UI-tekst
i stedet for `t()`. Poenget: **fjern «huske det»-avhengigheten** — maskinen
håndhever regelen, ikke disiplin.

> Bakgrunn: hardkodede strenger sniker seg inn som «det naturlige» å skrive, og
> blir fanget først på gjennomlesning (om i det hele tatt). En prebuild-sperre gjør
> at det ikke *kan* nå deploy. Mønsteret er lånt fra bankboks/Emergent, som kjører
> en hel `lint:*`-suite via `vercel-build` (parity + used-key + unused m.fl.).

---

## Hva den sjekker

1. **Paritet** — alle språkfiler har identisk nøkkelsett (ingen «kun i no» / «kun
   i en»). Fanger glemte oversettelser og feilstavede nøkler ved innlegging.
2. **Hardkodet UI-tekst** i `.tsx` (klient-komponenter):
   - JSX-tekstnoder med språk-spesifikke tegn (f.eks. `æ/ø/å`) som ikke går via `t()`
     — uansett hvor på linja de står (`<h1>Hei på deg</h1>`), også `{"…"}`-literaler.
     Leses med TypeScript-parseren, så linjeskift ikke avgjør om tekst fanges.
   - Attributt-literaler: `aria-label` / `placeholder` / `title` = `"Tekst"` eller
     `{"Tekst"}` (skal være `{t("nøkkel")}`).
   - Bevisst literal? Legg `i18n-ok` som kommentar på linja.

> **Server-ruter** (`.ts` API-ruter) skannes ikke — de kan ikke bruke `t()`.
> Mønster for tekst som *vises* i UI fra server: send en **feil-KODE**, oversett
> med `t()` i klienten. E-post-innhold o.l. som skal være ett fast språk uansett
> app-locale, holdes utenfor bevisst.

---

## Oppsett (2 filer)

### 1) `scripts/i18n-lint.mjs`

Drop-in. Juster kun `CONFIG`-blokken øverst per prosjekt.

```js
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

// Strengliteral direkte i JSX: {"…"} / {`…`} (uten ${}-innskudd).
function literal(expr) {
  return expr && (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr))
    ? expr.text
    : null;
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

  const visit = (node) => {
    // JSX-tekst mellom tagger, uansett hvor på linja den står.
    if (ts.isJsxText(node) && NATIVE.test(node.text)) {
      const raw = src.slice(node.pos, node.end);
      hit(node.pos + raw.length - raw.trimStart().length, "JSX-tekst", node.text);
    }
    // {"…"} som barn av et element/fragment.
    if (ts.isJsxExpression(node) && !ts.isJsxAttribute(node.parent)) {
      const text = literal(node.expression);
      if (text != null && NATIVE.test(text)) hit(node.expression.getStart(sf), "JSX-tekst", text);
    }
    // aria-label / placeholder / title = "…" eller {"…"}.
    if (ts.isJsxAttribute(node) && ATTRS.has(node.name.getText(sf)) && node.initializer) {
      const init = node.initializer;
      const text = ts.isStringLiteral(init) ? init.text : literal(init.expression);
      if (text != null && text.trim() !== "") hit(node.getStart(sf), "attributt", node.getText(sf));
    }
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
```

### 2) `package.json` — kjør automatisk før build

```json
{
  "scripts": {
    "i18n-lint": "node scripts/i18n-lint.mjs",
    "prebuild": "node scripts/i18n-lint.mjs",
    "build": "next build"
  }
}
```

`prebuild` kjøres av npm automatisk før `build` — også på Vercel (som kjører
`npm run build`). Sperren feiler → build feiler → deploy stoppes.

---

## Tilpasnings-sjekkliste (nytt prosjekt)

- [ ] Sett `LOCALES` til dine språkfiler (kanonisk språk først).
- [ ] Sett `ROOTS` til mappene med klient-komponenter.
- [ ] Sett `NATIVE` til språkets tegn (norsk: `æøåÆØÅ`; svensk: legg til `äöÄÖ`; osv.).
- [ ] `SKIP`: legg inn store filer som ikke er i18n-et ennå (midlertidig) — tøm etter hvert.
- [ ] Wire `prebuild` (eller `vercel-build: "npm run i18n-lint && next build"`).
- [ ] Kjør `npm run i18n-lint` én gang, rydd treffene.

---

## Bruk

- **Bevisst literal** (brand, kode, ikke-oversettbart): legg `{/* i18n-ok */}` eller
  `// i18n-ok` på linja.
- **Server-tekst i UI**: send feil-/status-KODE fra ruten, `t()` i klienten.
- **Dynamisk nøkkel** (`t(`prefix.${x}`)`): sjekk 2 rører den ikke (den ser bare
  hardkodet tekst). Vil du også verifisere at nøkkelen finnes, se «Utvidelser».

---

## Utvidelser (som bankboks' `lint:i18n-sync`)

Legg til når prosjektet vokser:

- **Used-key-existence** — hver litterale `t("x.y")` i kildekoden finnes i kanonisk
  språkfil (fanger feilstaving / manglende nøkkel).
- **Unused-keys** — nøkler i språkfila som ikke brukes noe sted (med en eksplisitt
  `EXEMPT`-liste for dynamiske/template-nøkler, hver med fil:linje-referanse).
- **Flere sperrer i en `lint:all`** — isolasjon, PII, duplisering osv., kjørt samlet
  via `vercel-build`.

---

## Hvorfor prebuild og ikke en git-hook

- Git-hooks (husky) må installeres pr. maskin og kan `--no-verify`-forbigås.
- `prebuild` kjører **også i CI/Vercel**, så en grønn deploy garanterer at sperren
  passerte. Det er den harde garantien du vil ha.
