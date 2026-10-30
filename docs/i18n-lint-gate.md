# i18n-sperre (lint-gate) — mal for nye prosjekter

En liten, avhengighetsfri **build-sperre** som feiler før hver `next build` hvis
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
   - JSX-tekstnoder med språk-spesifikke tegn (f.eks. `æ/ø/å`) som ikke går via `t()`.
   - Attributt-literaler: `aria-label` / `placeholder` / `title` = `"Tekst"` (skal
     være `{t("nøkkel")}`).
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
