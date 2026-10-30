// Validering av input — brukes både i skjemaet og i API-et, så reglene er like.
import { isCountryCode, type CountryCode } from "./countries";
import { isPerson, type ErrorCode, type Person } from "./types";
import { weekFitsMonth } from "./weeks";

export const PLACE_MAX = 80;
export const LINK_MAX = 500;

export interface NewDestination {
  country: CountryCode;
  place: string;
  month: number | null;
  week: number | null;
  link: string | null;
  addedBy: Person;
  score: number | null;
}

type Result<T> = { ok: true; value: T } | { ok: false; error: ErrorCode };

const isInt = (x: unknown, min: number, max: number): x is number =>
  Number.isInteger(x) && (x as number) >= min && (x as number) <= max;

/** Tom → null. Uten protokoll → https:// foran (folk limer ofte inn «instagram.com/…»). */
export function normalizeLink(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

function validLink(s: string): boolean {
  if (s.length > LINK_MAX) return false;
  try {
    const u = new URL(s);
    return (u.protocol === "http:" || u.protocol === "https:") && u.hostname.includes(".");
  } catch {
    return false;
  }
}

export function validateScore(x: unknown): x is number | null {
  return x === null || isInt(x, 1, 10);
}

export function validateNew(input: unknown): Result<NewDestination> {
  if (typeof input !== "object" || input === null) return { ok: false, error: "invalid_body" };
  const o = input as Record<string, unknown>;

  if (!isCountryCode(o.country)) return { ok: false, error: "invalid_country" };
  const place = typeof o.place === "string" ? o.place.trim() : "";
  if (!place || place.length > PLACE_MAX) return { ok: false, error: "invalid_place" };

  const month = o.month ?? null;
  if (month !== null && !isInt(month, 1, 12)) return { ok: false, error: "invalid_month" };
  const week = o.week ?? null;
  if (week !== null && !isInt(week, 1, 53)) return { ok: false, error: "invalid_week" };
  if (month !== null && week !== null && !weekFitsMonth(week, month))
    return { ok: false, error: "week_not_in_month" };

  let link: string | null = null;
  if (o.link != null) {
    if (typeof o.link !== "string") return { ok: false, error: "invalid_link" };
    link = normalizeLink(o.link);
    if (link !== null && !validLink(link)) return { ok: false, error: "invalid_link" };
  }

  if (!isPerson(o.addedBy)) return { ok: false, error: "invalid_person" };
  const score = o.score ?? null;
  if (!validateScore(score)) return { ok: false, error: "invalid_score" };

  return {
    ok: true,
    value: { country: o.country, place, month, week, link, addedBy: o.addedBy, score },
  };
}
