// Topp 3-lister. Score er unik per person, så personlige lister har aldri uavgjort.
import type { Destination, Person } from "./types";

export function topForPerson(list: Destination[], person: Person, n = 3): Destination[] {
  return list
    .filter((d) => d.scores[person] != null)
    .sort((a, b) => b.scores[person]! - a.scores[person]!)
    .slice(0, n);
}

/** Felles: alle reisemål med minst én score; manglende score teller 0. Høyest sum;
 *  ved likhet vinner jevnest score (høyest laveste — så scoret av begge slår
 *  scoret av én), deretter den som ble lagt inn først. */
export function topCommon(list: Destination[], n = 3): Destination[] {
  const a = (d: Destination) => d.scores.anita ?? 0;
  const m = (d: Destination) => d.scores.michael ?? 0;
  const sum = (d: Destination) => a(d) + m(d);
  const low = (d: Destination) => Math.min(a(d), m(d));
  return list
    .filter((d) => d.scores.anita != null || d.scores.michael != null)
    .sort((x, y) => sum(y) - sum(x) || low(y) - low(x) || x.createdAt - y.createdAt)
    .slice(0, n);
}

/** Felles sum (manglende score = 0). */
export function commonSum(d: Destination): number {
  return (d.scores.anita ?? 0) + (d.scores.michael ?? 0);
}
