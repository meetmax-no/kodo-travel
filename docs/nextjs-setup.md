# Next.js-oppsett (spor 2) — oppskrift

Kjørbar steg-for-steg for å gjøre et nytt prosjekt fra malen om til en
**Next.js + i18n**-app med `@kodo/shared`, i18n-sperren og Upstash Redis klar.

> **Spor 1 (statisk)** trenger ingen av disse stegene — behold `index.html`.
> Følg denne oppskriften kun når prosjektet skal være Next.js.

> **Merk (Claude Code):** Flere steg endrer filer som `create-next-app` nettopp
> lagde (`app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `next.config.ts`).
> Claude Code krever at en fil **leses før den overskrives** — kjør `Read` før
> `Edit`/`Write` på disse. Får du «File has not been read yet», er det denne
> regelen, ikke en feil.

---

## 1. Scaffold Next.js (App Router + TypeScript + Tailwind)

`create-next-app` **nekter å scaffolde oppå** en mappe som allerede har filer — og
malen har `CLAUDE.md`, `docs/`, `index.html` m.m. Løsningen: scaffold i en
temp-undermappe og flett filene opp **uten å overskrive** malfilene.

```bash
# 1. Scaffold i en temp-mappe (navnet kan IKKE starte med punktum — npm-regel)
npx create-next-app@latest scaffold-tmp --ts --app --tailwind --eslint --no-src-dir --import-alias "@/*"

# 2. Fjern den statiske siden — Next.js eier UI-et nå
rm -f index.html

# 3. Flett Next-filene opp i rota UTEN å overskrive malfiler
shopt -s dotglob            # ta med dotfiles (.gitignore osv.)
cp -Rn scaffold-tmp/. .     # -n = ikke overskriv eksisterende
rm -rf scaffold-tmp
```

(Next 16 bruker Turbopack som standard; legg til `--no-turbopack` i steg 1 hvis du vil slå det av.)

> `cp -Rn` beholder malens `README.md`, `.gitignore` og repoets `.git`, og legger
> kun til det Next lagde (`app/`, `package.json`, `next.config.ts`, `public/` …).
> På Linux kan `cp` advare om at `-n` er «non-portable» — ufarlig. Alternativ:
> `rsync -a --ignore-existing scaffold-tmp/ .`

Tailwind kreves fordi `@kodo/shared` bruker `clsx` + `tailwind-merge` + `tokens.css`.

## 2. Dra inn `@kodo/shared`

`package.json`:

```jsonc
"dependencies": {
  "@kodo/shared": "github:meetmax-no/kodo-shared-repo#main",
  "@upstash/redis": "^1.34.0"
}
```

`next.config.ts` (create-next-app lager den som `.ts`) — transpiler den rå TS-en:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@kodo/shared"],
};

export default nextConfig;
```

Importer designtokens i global CSS — rett etter Tailwind-importen i `app/globals.css`:

```css
@import "tailwindcss";
@import "@kodo/shared/tokens.css";
```

Kjør `npm install`. (Oppstarts-hooken gjør dette automatisk i nye økter.)

## 3. i18n — dict-JSON-er + LocaleProvider

Se `docs/i18n.md` for full konvensjon. Kortversjon:

`lib/locales/no.json` (kanonisk, flat):

```json
{ "common.title": "Hei verden", "common.language": "Språk" }
```

`lib/locales/en.json` (samme nøkkelsett):

```json
{ "common.title": "Hello world", "common.language": "Language" }
```

`app/providers.tsx`:

```tsx
"use client";
import { LocaleProvider } from "@kodo/shared/ui";
import no from "@/lib/locales/no.json";
import en from "@/lib/locales/en.json";

export function Providers({ children }: { children: React.ReactNode }) {
  return <LocaleProvider dicts={{ no, en }}>{children}</LocaleProvider>;
}
```

Wire `<Providers>` i `app/layout.tsx`, og bruk `useLocale()` i klient-komponenter:

```tsx
"use client";
import { useLocale } from "@kodo/shared/ui";
export default function Page() {
  const { t } = useLocale();
  return <h1>{t("common.title")}</h1>;
}
```

## 4. i18n-sperre (prebuild)

Følg `docs/i18n-lint-gate.md`: kopier inn `scripts/i18n-lint.mjs`, juster
`CONFIG` (`LOCALES` = `lib/locales/no.json` + `en.json`), og wire i `package.json`:

```jsonc
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "i18n-lint": "node scripts/i18n-lint.mjs",
  "prebuild": "node scripts/i18n-lint.mjs"
}
```

## 5. Upstash Redis (valgfritt)

Se `docs/upstash-redis.md`: sett opp via Vercel Marketplace, bruk
`Redis.fromEnv()` fra `@upstash/redis` server-side.

## 6. Deploy

Vercel oppdager Next.js automatisk (ingen «Framework: Other» her). Push til
`main` → auto-deploy. `prebuild` kjører i18n-sperren på Vercel før `next build`.

---

## Kjøre og se appen lokalt

```bash
npm run dev   # → http://localhost:3000
```

I en **remote container** (Claude Code på web) er ikke `localhost:3000` direkte
tilgjengelig fra din maskin. Har surface-en din port-forwarding / preview-panel,
pek den på port 3000. Ellers er **screenshot** den sikreste måten å se resultatet:

- Chromium er preinstallert (`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`) — ikke kjør `playwright install`.
- Playwright-pakken ligger ofte **globalt**, ikke i prosjektet. ESM ignorerer
  `NODE_PATH`, så importer den globale modulen via **absolutt sti** (finn roten
  med `npm root -g`):
  ```js
  import { chromium } from "<npm-root-g>/playwright/index.mjs";
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto("http://localhost:3000");
  await p.screenshot({ path: "shot.png" });
  await b.close();
  ```

> `LocaleProvider` auto-detekterer nettleserspråk (se `docs/i18n.md`), så en
> headless `en-US`-nettleser lander på engelsk — klikk 🇳🇴 for å fange norsk.

---

## Sjekkliste

- [ ] `create-next-app` kjørt, `index.html` fjernet
- [ ] `@kodo/shared` + `transpilePackages` + `tokens.css` importert
- [ ] `lib/locales/no.json` + `en.json` (samme nøkkelsett)
- [ ] `<LocaleProvider>` wiret én gang, `useLocale()` i bruk
- [ ] `scripts/i18n-lint.mjs` + `prebuild` aktiv, `npm run i18n-lint` grønn
- [ ] (valgfritt) Upstash Redis via Vercel + `lib/redis.ts`
- [ ] `CLAUDE.md` → Teknologi oppdatert til Next.js

---

## Verifisert

Denne oppskriften er testet ende-til-ende mot en kopi av malen:

- Temp-mappe-fletting (`cp -Rn`) bevarer alle malfiler (`README.md`, `.gitignore`,
  `docs/`, `CLAUDE.md`, `.claude/`), fjerner `index.html`, og resultatet bygger grønt.
- `create-next-app` (Next.js 16, App Router, TS, Tailwind v4) + `@kodo/shared` via
  `transpilePackages` bygger grønt; `LocaleProvider`/`useLocale`/`t()` fungerer.
- i18n-sperren stopper build ved paritetsbrudd, JSX-tekstnoder med `æøå` og
  hardkodede `placeholder`/`aria-label`/`title` — mens `i18n-ok` lar bevisste
  literaler passere.
