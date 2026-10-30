"use client";

// Nytt reisemål: land (søk), sted, tidspunkt (måned + ISO-uke, uten år), lenke og
// egen score. «Lagt inn av» = personen valgt øverst. Samme validering som API-et.
import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { kodoButtonPrimary, kodoField, kodoLabel, useLocale } from "@kodo/shared/ui";
import { CountryPicker } from "@/components/CountryPicker";
import { send, useDestinations } from "@/components/data";
import { monthName, usedScores } from "@/components/format";
import { usePerson } from "@/components/PersonProvider";
import { ScorePicker } from "@/components/ScorePicker";
import type { CountryCode } from "@/lib/countries";
import { PLACE_MAX, validateNew } from "@/lib/validate";
import { MONTHS, WEEKS, weekFitsMonth, weeksInMonth } from "@/lib/weeks";

const toNum = (v: string) => (v === "" ? null : Number(v));

export default function NewDestination() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const { person } = usePerson();
  const { list, reload } = useDestinations();

  const [country, setCountry] = useState<CountryCode | null>(null);
  const [place, setPlace] = useState("");
  const [month, setMonth] = useState<number | null>(null);
  const [week, setWeek] = useState<number | null>(null);
  const [link, setLink] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const used = useMemo(() => (person && list ? usedScores(list, person) : new Map<number, string>()), [list, person]);
  const weekOptions = month == null ? WEEKS : weeksInMonth(month);

  function onMonth(m: number | null) {
    setMonth(m);
    if (m != null && week != null && !weekFitsMonth(week, m)) setWeek(null);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const v = validateNew({ country, place, month, week, link, addedBy: person, score });
    if (!v.ok) return setError(t(`error.${v.error}`));
    setSaving(true);
    const r = await send("POST", "/api/destinations", v.value);
    setSaving(false);
    if (r.ok) {
      // Next 16 (Cache Components) skjuler siden med <Activity> i stedet for å fjerne
      // den — nullstill skjemaet, ellers står forrige reisemål der neste gang.
      setCountry(null);
      setPlace("");
      setMonth(null);
      setWeek(null);
      setLink("");
      setScore(null);
      return router.push("/");
    }
    setError(t(`error.${r.error}`));
    if (r.error === "score_taken") {
      setScore(null);
      void reload();
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">{t("nav.new")}</h1>

      <div>
        <label htmlFor="country" className={kodoLabel}>{t("form.country")}</label>
        <CountryPicker id="country" value={country} onChange={setCountry} />
      </div>

      <div>
        <label htmlFor="place" className={kodoLabel}>{t("form.place")}</label>
        <input
          id="place"
          className={kodoField}
          value={place}
          maxLength={PLACE_MAX}
          autoComplete="off"
          placeholder={t("form.place_placeholder")}
          onChange={(e) => setPlace(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="month" className={kodoLabel}>
            {t("form.month")} <span className="normal-case tracking-normal">({t("form.optional")})</span>
          </label>
          <select id="month" className={kodoField} value={month ?? ""} onChange={(e) => onMonth(toNum(e.target.value))}>
            <option value="">{t("form.not_set")}</option>
            {MONTHS.map((m) => (
              <option key={m} value={m}>{monthName(m, locale)}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="week" className={kodoLabel}>
            {t("form.week")} <span className="normal-case tracking-normal">({t("form.optional")})</span>
          </label>
          <select id="week" className={kodoField} value={week ?? ""} onChange={(e) => setWeek(toNum(e.target.value))}>
            <option value="">{t("form.not_set")}</option>
            {weekOptions.map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="link" className={kodoLabel}>
          {t("form.link")} <span className="normal-case tracking-normal">({t("form.optional")})</span>
        </label>
        <input
          id="link"
          type="url"
          inputMode="url"
          autoComplete="off"
          autoCapitalize="none"
          className={kodoField}
          value={link}
          placeholder={t("form.link_placeholder")}
          onChange={(e) => setLink(e.target.value)}
        />
      </div>

      <div>
        <div className={kodoLabel}>
          {t("form.score")} <span className="normal-case tracking-normal">({t("form.optional")})</span>
        </div>
        <ScorePicker value={score} used={used} disabled={!person} onPick={(s) => setScore(score === s ? null : s)} />
      </div>

      <p className="text-sm text-[var(--kodo-muted)]">
        {t("form.added_by")}: <span className="font-semibold text-[var(--kodo-text)]">{person ? t(`person.${person}`) : "–"}</span>
      </p>

      {error && (
        <p role="alert" className="rounded-lg bg-[var(--kodo-danger-bg)] px-3 py-2 text-sm text-[var(--kodo-tint-red-fg)]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className={`${kodoButtonPrimary} w-full`}
        style={{ backgroundColor: "var(--kodo-blue)" }}
      >
        {saving ? t("form.saving") : t("form.save")}
      </button>
    </form>
  );
}
