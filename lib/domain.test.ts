import { test } from "node:test";
import assert from "node:assert/strict";
import { COUNTRY_CODES, countryName, flag, isCountryCode } from "./countries";
import { topCommon, topForPerson } from "./ranking";
import type { Destination } from "./types";
import { normalizeLink, validateNew } from "./validate";
import { isoWeek, weekFitsMonth, weeksInMonth, WEEKS } from "./weeks";

const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));

test("land: koder, flagg og navn", () => {
  assert.equal(COUNTRY_CODES.length, 249);
  assert.equal(isCountryCode("NO"), true);
  assert.equal(isCountryCode("XX"), false);
  assert.equal(isCountryCode("no"), false);
  assert.equal(flag("NO"), "🇳🇴");
  assert.equal(countryName("NO", "no"), "Norge");
  assert.equal(countryName("ES", "en"), "Spain");
});

test("uker: ISO 8601-ukenummer", () => {
  assert.equal(isoWeek(utc(2026, 1, 1)), 1); // torsdag
  assert.equal(isoWeek(utc(2027, 1, 1)), 53); // fredag → siste uke i 2026
  assert.equal(isoWeek(utc(2021, 1, 3)), 53); // søndag → uke 53 i 2020
  assert.equal(isoWeek(utc(2024, 12, 30)), 1); // mandag → uke 1 i 2025
  assert.equal(isoWeek(utc(2026, 3, 12)), 11);
});

test("uker: hvilke uker kan falle i en måned (uten år)", () => {
  assert.deepEqual(
    WEEKS.filter((w) => weekFitsMonth(w, 1) || weekFitsMonth(w, 12)).filter((w) => w === 53 || w === 1),
    [1, 53],
  );
  for (let m = 2; m <= 11; m++) assert.equal(weekFitsMonth(53, m), false, `uke 53 i måned ${m}`);
  assert.equal(weekFitsMonth(1, 12), true); // 29.–31. des kan være uke 1
  assert.equal(weekFitsMonth(11, 3), true);
  assert.equal(weekFitsMonth(11, 7), false);
  // Hver uke 1–53 hører til minst én måned.
  for (const w of WEEKS) assert.ok([...Array(12)].some((_, i) => weekFitsMonth(w, i + 1)), `uke ${w}`);
  assert.deepEqual(weeksInMonth(3), [...weeksInMonth(3)].sort((a, b) => a - b));
});

const d = (id: string, createdAt: number, anita?: number, michael?: number): Destination => ({
  id, country: "IT", place: id, month: null, week: null, link: null, addedBy: "anita", createdAt,
  scores: { ...(anita != null && { anita }), ...(michael != null && { michael }) },
});

test("rangering: topp 3 per person", () => {
  const list = [d("a", 1, 5), d("b", 2, 10), d("c", 3), d("e", 4, 7), d("f", 5, 9)];
  assert.deepEqual(topForPerson(list, "anita").map((x) => x.id), ["b", "f", "e"]);
  assert.deepEqual(topForPerson(list, "michael"), []);
});

test("rangering: felles topp 3 — sum, så jevnest, så eldst", () => {
  const list = [
    d("bare-anita", 1, 10),
    d("ti-sju", 2, 10, 7), // 17, laveste 7
    d("ni-åtte", 3, 9, 8), // 17, laveste 8 → foran ti-sju
    d("åtte-ni", 4, 8, 9), // 17, laveste 8, nyere enn ni-åtte
    d("lav", 5, 1, 2),
  ];
  assert.deepEqual(topCommon(list).map((x) => x.id), ["ni-åtte", "åtte-ni", "ti-sju"]);
  assert.equal(topCommon(list).some((x) => x.id === "bare-anita"), false);
});

test("validering: gyldig minimum og normalisering", () => {
  const r = validateNew({ country: "IT", place: "  Roma ", addedBy: "michael" });
  assert.deepEqual(r, {
    ok: true,
    value: { country: "IT", place: "Roma", month: null, week: null, link: null, addedBy: "michael", score: null },
  });
  assert.equal(normalizeLink("instagram.com/p/abc"), "https://instagram.com/p/abc");
  assert.equal(normalizeLink("  "), null);
});

test("validering: feilkoder", () => {
  const base = { country: "IT", place: "Roma", addedBy: "anita" };
  const err = (o: object) => {
    const r = validateNew({ ...base, ...o });
    return r.ok ? "ok" : r.error;
  };
  assert.equal(validateNew(null).ok, false);
  assert.equal(err({ country: "XX" }), "invalid_country");
  assert.equal(err({ place: "   " }), "invalid_place");
  assert.equal(err({ place: "x".repeat(81) }), "invalid_place");
  assert.equal(err({ month: 13 }), "invalid_month");
  assert.equal(err({ week: 54 }), "invalid_week");
  assert.equal(err({ month: 7, week: 1 }), "week_not_in_month");
  assert.equal(err({ month: 3, week: 11 }), "ok");
  assert.equal(err({ week: 11 }), "ok");
  assert.equal(err({ link: "javascript:alert(1)" }), "invalid_link");
  assert.equal(err({ link: "ftp://x.com/a" }), "invalid_link");
  assert.equal(err({ link: 42 }), "invalid_link");
  assert.equal(err({ link: "https://www.instagram.com/p/abc/" }), "ok");
  assert.equal(err({ addedBy: "ola" }), "invalid_person");
  for (const s of [0, 11, 1.5, "5"]) assert.equal(err({ score: s }), "invalid_score", `score ${s}`);
  assert.equal(err({ score: 10 }), "ok");
});
