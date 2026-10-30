// Upstash Redis (REST) — kun server-side; token skal aldri til klienten.
// Vercel-integrasjonen injiserer KV_REST_API_URL + KV_REST_API_TOKEN
// (Production + Preview), så klienten konstrueres eksplisitt — se docs/upstash-redis.md.
import "server-only";
import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});
