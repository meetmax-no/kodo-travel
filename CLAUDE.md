# Prosjekt: [BYTT MEG]

> Kort én-linjes beskrivelse av hva dette prosjektet er.

## Oversikt
Beskriv formålet med prosjektet her — hva det gjør og for hvem.

## Oppsett-valg (nytt prosjekt)
Velg spor når prosjektet startes (spør bruker hvis uklart):
1. **Statisk** — `index.html` er en ferdig testside med **innebygd i18n (no/en)** i
   ren JavaScript (flaggvelger, `localStorage`, `navigator.language`-deteksjon — samme
   filosofi som `@kodo/shared`, uten rammeverk). Forhåndsvis med
   `python3 -m http.server 8000`. Deploy på Vercel med Framework **Other** (tomt build-steg).
2. **Next.js + i18n** — følg `docs/nextjs-setup.md` (Next.js + Tailwind +
   `@kodo/shared`-i18n + i18n-sperre + evt. Upstash Redis).

Velger du ingen av delene nå, står malen som en statisk side til du bestemmer deg.

## Teknologi
- **Spor 2 valgt:** Next.js 16.4 (App Router, TypeScript, Turbopack) + Tailwind v4
  (via `@tailwindcss/turbopack`-loaderen i `next.config.ts`, ingen PostCSS-config).
  `cacheComponents` og `partialPrefetching` er på (create-next-app-standard).
- i18n: `@kodo/shared` (`github:meetmax-no/kodo-shared-repo#main`) via `transpilePackages`.
  Ordbøker: `lib/locales/no.json` (kanonisk) + `en.json`, flate og med identisk nøkkelsett.
  `<LocaleProvider>` wires én gang i `app/providers.tsx` → `app/layout.tsx`.
- Tema: `@kodo/shared/tokens.css` importeres i `app/globals.css` rett etter Tailwind
  (`--kodo-*`-tokens; `@source` der gjør at Tailwind genererer klassene til shared-komponentene).
- `AGENTS.md` skrives/vedlikeholdes av `next dev`: les guidene i `node_modules/next/dist/docs/`
  før Next-kode skrives (versjonen kan avvike fra treningsdata).
- Upstash Redis via Vercel Marketplace: integrasjonen injiserer `KV_REST_API_URL` +
  `KV_REST_API_TOKEN` (pluss `KV_URL`, `REDIS_URL`, `KV_REST_API_READ_ONLY_TOKEN`) i
  **Production og Preview — ikke Development**. Klient: `lib/redis.ts` (`import "server-only"`,
  så build feiler hvis den importeres i en klient-komponent). Se `docs/upstash-redis.md`.

## Kom i gang
- Avhengigheter installeres **automatisk** ved øktstart via `.claude/hooks/session-start.sh`.
- Lokal forhåndsvisning av en statisk side: `python3 -m http.server 8000`
- Next.js: se `docs/nextjs-setup.md`.

## Arbeidsflyt og konvensjoner
- **Jobb rett på `main`. Ikke opprett sidegrener.** Dette er et solo-prosjekt
  (kun én utvikler). I Claude Code-økter: commit og push **direkte til `main`** —
  ikke lag en `claude/…`-branch, og ikke bruk PR-flyt. Får du en økt som starter
  på en egen branch, flytt arbeidet til `main` med én gang.
- Commit ofte med tydelige meldinger; push til GitHub.
- Vi jobber med **Vercel** i tillegg til GitHub: push til `main` utløser **auto-deploy** på Vercel.
- Legg til test-/lint-kommandoer her når de finnes, så Claude vet hvordan de kjøres.
  - `npm run dev` — utviklingsserver (http://localhost:3000)
  - `npm run i18n-lint` — i18n-sperren (paritet + hardkodet UI-tekst i `app/`, `components/`)
  - `npm run lint` — ESLint
  - `npm run build` — produksjonsbuild; `prebuild` kjører i18n-sperren først
- i18n: bruk `@kodo/shared`-motoren (avhengighetsfri `t()`), ikke next-intl — se `docs/i18n.md`.
- Ved i18n/Next.js: se `docs/i18n-lint-gate.md` og wire prebuild-sperren.
- Upstash Redis: settes vanligvis opp via Vercel Marketplace — se `docs/upstash-redis.md`.

## Deploy
- Statisk side: koble repoet til **Vercel** (Framework: **Other**, tomt build-steg) → auto-deploy fra `main`.
- Next.js: Vercel oppdager rammeverket automatisk → auto-deploy fra `main` (`prebuild` kjører i18n-sperren først).

## Notater til Claude
- Hold koden i samme stil som resten av prosjektet.
- Spør hvis noe er uklart i stedet for å gjette på viktige valg.
