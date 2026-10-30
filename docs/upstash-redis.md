# Upstash Redis — oppsett

Kort: sett opp Redis via **Vercel Marketplace** (vanligste måten), og bruk
**`@upstash/redis`** (REST) i koden. Ingen fast klient er bakt inn i malen —
dette er oppskriften, så du velger riktig variant per prosjekt.

---

## 1. Provisjonér via Vercel (anbefalt)

- Vercel-prosjekt → **Storage** → **Add Database** → **Upstash Redis** (Marketplace).
- Vercel oppretter databasen og **injiserer miljøvariabler automatisk** i
  prosjektet (Production / Preview / Development), typisk:
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
  - (noen oppsett legger også `KV_REST_API_URL` / `KV_REST_API_TOKEN`)
- Ingen manuell nøkkel-kopiering. Roterer du token i Vercel, følger det med i deploy.

> Sjekk prosjektets **Environment Variables** i Vercel for de faktiske navnene —
> bruk dem klienten forventer (se under).

---

## 2. Klient i koden

```bash
npm i @upstash/redis
```

```ts
// lib/redis.ts
import { Redis } from "@upstash/redis";

// Leser UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN fra env.
export const redis = Redis.fromEnv();
```

Bruk kun i **server-kontekst** (route handlers / server actions) — aldri i
klient-komponenter (token skal ikke eksponeres).

```ts
await redis.set("key", "value");
const v = await redis.get<string>("key");
```

Får du bare `KV_REST_API_*`-variabler fra integrasjonen, konstruer eksplisitt:

```ts
export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});
```

---

## 3. Lokalt

Hent Vercel-env til `.env.local`:

```bash
vercel env pull .env.local
```

(Vercel CLI installeres allerede av oppstarts-hooken.)

---

## Alternativer (når du ikke bruker Vercel-integrasjonen)

- **Manuelt fra Upstash-konsollen:** kopier REST URL + token til `.env`
  (se `.env.example`), samme `new Redis({ url, token })`.
- **TCP / `ioredis`:** kun hvis du trenger en vedvarende TCP-forbindelse. Bruk
  Upstash sin `redis://…` connection string:
  ```ts
  import Redis from "ioredis";
  export const redis = new Redis(process.env.REDIS_URL!);
  ```
  Merk: `ioredis` passer dårlig på Vercel serverless/edge (ny forbindelse pr.
  invokasjon) — foretrekk REST-klienten der.

---

## Sikkerhet

- Token er hemmelig → kun server-side, aldri `NEXT_PUBLIC_*`.
- `.env*` er allerede git-ignorert; kun `.env.example` sjekkes inn.
