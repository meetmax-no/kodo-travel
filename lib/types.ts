// Felles typer for reisemål (klient + server).
import type { CountryCode } from "./countries";

export type Person = "anita" | "michael";
export const PEOPLE: readonly Person[] = ["anita", "michael"];

export function isPerson(x: unknown): x is Person {
  return x === "anita" || x === "michael";
}

export interface Destination {
  id: string;
  country: CountryCode;
  place: string;
  month: number | null;
  week: number | null;
  link: string | null;
  addedBy: Person;
  createdAt: number;
  /** Score 1–10 per person; hver verdi brukes maks én gang per person. */
  scores: Partial<Record<Person, number>>;
}

/** Feilkoder fra API-et — oversettes med t(`error.${kode}`) i klienten. */
export type ErrorCode =
  | "invalid_country"
  | "invalid_place"
  | "invalid_month"
  | "invalid_week"
  | "week_not_in_month"
  | "invalid_link"
  | "invalid_person"
  | "invalid_score"
  | "invalid_body"
  | "score_taken"
  | "not_found"
  | "server_error";
