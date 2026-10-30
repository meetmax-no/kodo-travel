# 🚀 Claude Starter

En gjenbrukbar **startmal** for nye prosjekter med Claude Code på web — din egen «kom-raskt-i-gang-knapp».

Malen kommer ferdig med:
- **`.claude/hooks/session-start.sh`** — installerer avhengigheter automatisk når en økt starter (Node/npm, Python — hvis prosjektet har dem) og sørger for at **Vercel CLI** er på plass
- **`.claude/settings.json`** — registrerer oppstarts-hooken
- **`CLAUDE.md`** — kontekstfil så Claude forstår prosjektet med én gang
- **`index.html`** — en minimal statisk side klar for Vercel-deploy (spor 1)
- **`docs/`** — oppskrifter for Next.js + i18n, i18n-sperre og Upstash Redis (spor 2)
- **`.env.example`** — plassholdere for miljøvariabler (Upstash Redis)

## To oppsett-spor

Malen kan brukes på to måter — velg når du starter et nytt prosjekt (Claude spør hvis det er uklart):

| Spor | Hva | Kom i gang |
|------|-----|------------|
| **1. Statisk** | `index.html`, klar til Vercel-deploy | Ingenting å gjøre — bare bygg videre |
| **2. Next.js + i18n** | Next.js (App Router, TS) + Tailwind + `@kodo/shared`-i18n + i18n-sperre + evt. Upstash Redis | Følg [`docs/nextjs-setup.md`](docs/nextjs-setup.md) |

Velger du ingen av delene, står malen som en statisk side til du bestemmer deg.

## Slik bruker du malen

### Alternativ A — «Use this template» (enklest)
1. Trykk den grønne **«Use this template»**-knappen øverst på GitHub-repoet
2. Gi det nye repoet et navn → **Create repository**
3. Start en ny **Claude Code**-økt og velg det nye repoet som kilde
4. Oppdater `CLAUDE.md` (bytt ut `[BYTT MEG]`), velg spor, og begynn å bygge

### Alternativ B — klon manuelt
```bash
git clone https://github.com/<eier>/<dette-repoet>.git nytt-prosjekt
cd nytt-prosjekt
rm -rf .git && git init   # start med ren historikk
```

## Hva skjer ved øktstart?
Hooken (`session-start.sh`):
- sjekker om prosjektet har `package.json`, `requirements.txt` eller `pyproject.toml`, og installerer avhengighetene automatisk (gjør ingenting hvis prosjektet ikke har noen — helt trygt),
- sørger for at **Vercel CLI** er installert (hopper over uten å feile hvis nettet er blokkert).

> 💡 Oppstarts-hooken virker først når den ligger på repoets **default-branch** (`main`). Etter det bruker alle nye økter den automatisk.

## Konvensjoner (se `CLAUDE.md`)
- Jobb direkte på **`main`** (solo-prosjekt), commit ofte, push til GitHub.
- Push til `main` utløser **auto-deploy** på Vercel.
- **i18n:** den avhengighetsfrie `t()`-motoren fra `@kodo/shared` — ikke next-intl. Se [`docs/i18n.md`](docs/i18n.md).
- **i18n-sperre:** prebuild-gate som feiler build ved brutt paritet / hardkodet UI-tekst. Se [`docs/i18n-lint-gate.md`](docs/i18n-lint-gate.md).
- **Upstash Redis:** settes vanligvis opp via Vercel Marketplace. Se [`docs/upstash-redis.md`](docs/upstash-redis.md).

## Deploy til Vercel
- **Statisk side:** importer repoet på [vercel.com/new](https://vercel.com/new), la alt stå på standard (Framework: **Other**), og trykk **Deploy**.
- **Next.js:** Vercel oppdager rammeverket automatisk → auto-deploy fra `main` (`prebuild` kjører i18n-sperren før `next build`).
