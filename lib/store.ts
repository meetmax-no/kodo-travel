// Reisemål i Upstash Redis. Alt som berører score går via Lua-skript (atomisk),
// så regelen «hver score kun én gang per person» holder også når begge endrer samtidig.
//
//   travel:dest:{id}      hash: country, place, month, week, link, addedBy, createdAt
//   travel:dests          sorted set: id → createdAt
//   travel:score:{person} hash: score (1–10) → id   (én eier per score = unikhet)
import "server-only";
import { randomUUID } from "node:crypto";
import { isCountryCode } from "./countries";
import { redis } from "./redis";
import { isPerson, PEOPLE, type Destination, type Person } from "./types";
import type { NewDestination } from "./validate";

const DESTS = "travel:dests";
const destKey = (id: string) => `travel:dest:${id}`;
const scoreKey = (p: Person) => `travel:score:${p}`;

export const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Svar fra skriptene: ["ok"] | ["not_found"] | ["score_taken", eierId]. */
type ScriptResult = [string, string?];

// Fjerner personens nåværende score for et reisemål (brukes inne i skriptene).
const UNSCORE = `
local function unscore(hash, id)
  local all = redis.call("HGETALL", hash)
  for i = 1, #all, 2 do
    if all[i + 1] == id then redis.call("HDEL", hash, all[i]) end
  end
end
`;

// KEYS: dest, dests, score(addedBy) · ARGV: id, createdAt, score|"", felt/verdi-par …
const createScript = redis.createScript<ScriptResult>(`
if ARGV[3] ~= "" then
  local holder = redis.call("HGET", KEYS[3], ARGV[3])
  if holder then return {"score_taken", holder} end
end
redis.call("HSET", KEYS[1], unpack(ARGV, 4))
redis.call("ZADD", KEYS[2], ARGV[2], ARGV[1])
if ARGV[3] ~= "" then redis.call("HSET", KEYS[3], ARGV[3], ARGV[1]) end
return {"ok"}
`);

// KEYS: dest, score(person) · ARGV: id, score|"" ("" = fjern score)
const setScoreScript = redis.createScript<ScriptResult>(`${UNSCORE}
if redis.call("EXISTS", KEYS[1]) == 0 then return {"not_found"} end
if ARGV[2] ~= "" then
  local holder = redis.call("HGET", KEYS[2], ARGV[2])
  if holder and holder ~= ARGV[1] then return {"score_taken", holder} end
end
unscore(KEYS[2], ARGV[1])
if ARGV[2] ~= "" then redis.call("HSET", KEYS[2], ARGV[2], ARGV[1]) end
return {"ok"}
`);

// KEYS: dest, dests, score:anita, score:michael · ARGV: id
const deleteScript = redis.createScript<ScriptResult>(`${UNSCORE}
if redis.call("DEL", KEYS[1]) == 0 then return {"not_found"} end
redis.call("ZREM", KEYS[2], ARGV[1])
unscore(KEYS[3], ARGV[1])
unscore(KEYS[4], ARGV[1])
return {"ok"}
`);

/** [felt, verdi, felt, verdi, …] → objekt. */
function toObject(flat: string[]): Record<string, string> {
  const o: Record<string, string> = {};
  for (let i = 0; i < flat.length; i += 2) o[flat[i]] = flat[i + 1];
  return o;
}

const num = (s: string | undefined) => (s ? Number(s) : null);

export async function listDestinations(): Promise<Destination[]> {
  const [ids, ...scoreRows] = await redis
    .pipeline()
    .zrange(DESTS, 0, -1)
    .hgetall(scoreKey("anita"))
    .hgetall(scoreKey("michael"))
    .exec<[string[], string[], string[]]>();
  if (ids.length === 0) return [];

  // id → { anita: 9, michael: 7 }
  const scores = new Map<string, Partial<Record<Person, number>>>();
  PEOPLE.forEach((person, i) => {
    for (const [score, id] of Object.entries(toObject(scoreRows[i] ?? []))) {
      scores.set(id, { ...scores.get(id), [person]: Number(score) });
    }
  });

  const p = redis.pipeline();
  for (const id of ids) p.hgetall(destKey(id));
  const rows = await p.exec<string[][]>();

  return ids.flatMap((id, i) => {
    const r = toObject(rows[i] ?? []);
    if (!isCountryCode(r.country) || !isPerson(r.addedBy)) return []; // ufullstendig rad
    return [{
      id,
      country: r.country,
      place: r.place,
      month: num(r.month),
      week: num(r.week),
      link: r.link || null,
      addedBy: r.addedBy,
      createdAt: Number(r.createdAt),
      scores: scores.get(id) ?? {},
    }];
  });
}

export type WriteResult =
  | { ok: true; id: string }
  | { ok: false; error: "score_taken"; holder: string }
  | { ok: false; error: "not_found" };

function result(r: ScriptResult, id: string): WriteResult {
  if (r[0] === "ok") return { ok: true, id };
  if (r[0] === "score_taken") return { ok: false, error: "score_taken", holder: r[1] ?? "" };
  return { ok: false, error: "not_found" };
}

export async function createDestination(d: NewDestination): Promise<WriteResult> {
  const id = randomUUID();
  const createdAt = String(Date.now());
  const fields = [
    "country", d.country,
    "place", d.place,
    "month", d.month == null ? "" : String(d.month),
    "week", d.week == null ? "" : String(d.week),
    "link", d.link ?? "",
    "addedBy", d.addedBy,
    "createdAt", createdAt,
  ];
  const r = await createScript.exec(
    [destKey(id), DESTS, scoreKey(d.addedBy)],
    [id, createdAt, d.score == null ? "" : String(d.score), ...fields],
  );
  return result(r, id);
}

export async function setScore(id: string, person: Person, score: number | null): Promise<WriteResult> {
  const r = await setScoreScript.exec([destKey(id), scoreKey(person)], [id, score == null ? "" : String(score)]);
  return result(r, id);
}

export async function deleteDestination(id: string): Promise<WriteResult> {
  const r = await deleteScript.exec([destKey(id), DESTS, scoreKey("anita"), scoreKey("michael")], [id]);
  return result(r, id);
}
