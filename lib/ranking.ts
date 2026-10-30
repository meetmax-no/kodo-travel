// Topp 3-lister. Score er unik per person, så personlige lister har aldri uavgjort.
import type { Destination, Person } from "./types";

export function topForPerson(list: Destination[], person: Person, n = 3): Destination[] {
  return list
    .filter((d) => d.scores[person] != null)
    .sort((a, b) => b.scores[person]! - a.scores[person]!)
    .slice(0, n);
}

/** Felles: kun reisemål begge har scoret. Høyest sum; ved likhet vinner jevnest
 *  score (høyest laveste), deretter den som ble lagt inn først. */
export function topCommon(list: Destination[], n = 3): Destination[] {
  const both = list.filter((d) => d.scores.anita != null && d.scores.michael != null);
  const sum = (d: Destination) => d.scores.anita! + d.scores.michael!;
  const low = (d: Destination) => Math.min(d.scores.anita!, d.scores.michael!);
  return both
    .sort((a, b) => sum(b) - sum(a) || low(b) - low(a) || a.createdAt - b.createdAt)
    .slice(0, n);
}
