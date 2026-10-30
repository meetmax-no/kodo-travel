// Tidspunkt uten år: måned (1–12) og ISO-ukenummer (1–53). Uten år kan en uke
// falle i to måneder, så vi tillater de ukene som kan treffe måneden i et eller
// annet år. 2001–2028 dekker alle kombinasjoner av ukedag for 1. januar og skuddår.

export const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
export const WEEKS = Array.from({ length: 53 }, (_, i) => i + 1);

/** ISO 8601-ukenummer for en UTC-dato. */
export function isoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7; // mandag = 1 … søndag = 7
  d.setUTCDate(d.getUTCDate() + 4 - day); // torsdagen i samme uke avgjør året
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart) / 86_400_000 + 1) / 7);
}

let table: Map<number, Set<number>> | null = null;

function buildTable(): Map<number, Set<number>> {
  const t = new Map<number, Set<number>>(MONTHS.map((m) => [m, new Set<number>()]));
  for (let y = 2001; y <= 2028; y++) {
    for (let d = new Date(Date.UTC(y, 0, 1)); d.getUTCFullYear() === y; d.setUTCDate(d.getUTCDate() + 1)) {
      t.get(d.getUTCMonth() + 1)!.add(isoWeek(d));
    }
  }
  return t;
}

/** Ukenumre som kan falle i måneden (sortert). */
export function weeksInMonth(month: number): number[] {
  table ??= buildTable();
  return [...(table.get(month) ?? [])].sort((a, b) => a - b);
}

export function weekFitsMonth(week: number, month: number): boolean {
  return weeksInMonth(month).includes(week);
}
