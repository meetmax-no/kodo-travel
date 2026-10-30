// Visningshjelpere (språkavhengige via Intl, ingen egne tekster).
import type { Destination, Person } from "@/lib/types";

export function monthName(month: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" }).format(Date.UTC(2026, month - 1, 1));
}

/** «mars · uke 11», «uke 11», «mars» — eller null uten tidspunkt. */
export function timeLabel(d: Pick<Destination, "month" | "week">, locale: string, weekWord: string): string | null {
  const parts: string[] = [];
  if (d.month != null) parts.push(monthName(d.month, locale));
  if (d.week != null) parts.push(`${weekWord} ${d.week}`);
  return parts.length ? parts.join(" · ") : null;
}

/** «instagram.com» fra en lenke (uten www.). */
export function linkHost(link: string): string {
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return link;
  }
}

/** Personens brukte score på andre reisemål: score → stedsnavn. */
export function usedScores(list: Destination[], person: Person, exceptId?: string): Map<number, string> {
  const used = new Map<number, string>();
  for (const d of list) {
    const s = d.scores[person];
    if (s != null && d.id !== exceptId) used.set(s, d.place);
  }
  return used;
}
