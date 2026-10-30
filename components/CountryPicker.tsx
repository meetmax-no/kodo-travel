"use client";

// Søkbar landvelger: landnavn på valgt språk fra nettleseren, flagg fra koden.
// Søket ignorerer store/små bokstaver og aksenter (á, é …).
import { useMemo, useRef, useState } from "react";
import { useLocale, kodoButtonSecondary, kodoField } from "@kodo/shared/ui";
import { COUNTRY_CODES, countryName, flag, type CountryCode } from "@/lib/countries";

const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

export function CountryPicker({
  id,
  value,
  onChange,
}: {
  id: string;
  value: CountryCode | null;
  onChange: (code: CountryCode | null) => void;
}) {
  const { t, locale } = useLocale();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const countries = useMemo(
    () =>
      COUNTRY_CODES.map((code) => ({ code, name: countryName(code, locale) })).sort((a, b) =>
        a.name.localeCompare(b.name, locale),
      ),
    [locale],
  );
  const q = fold(query.trim());
  const hits = q ? countries.filter((c) => fold(c.name).includes(q) || c.code.toLowerCase() === q).slice(0, 8) : [];

  if (value) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--kodo-border-strong)] bg-[var(--kodo-surface)] px-3 py-2">
        <span className="flex items-center gap-2 text-base">
          <span aria-hidden className="text-2xl leading-none">{flag(value)}</span>
          {countryName(value, locale)}
        </span>
        <button
          type="button"
          className={kodoButtonSecondary}
          onClick={() => {
            onChange(null);
            setQuery("");
            requestAnimationFrame(() => inputRef.current?.focus());
          }}
        >
          {t("form.country_change")}
        </button>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        id={id}
        type="search"
        autoComplete="off"
        className={kodoField}
        placeholder={t("form.country_search")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {q && (
        <ul className="mt-2 overflow-hidden rounded-lg border border-[var(--kodo-border)]">
          {hits.length === 0 && <li className="px-3 py-2.5 text-sm text-[var(--kodo-muted)]">{t("form.country_none")}</li>}
          {hits.map((c) => (
            <li key={c.code}>
              <button
                type="button"
                onClick={() => {
                  onChange(c.code);
                  setQuery("");
                }}
                className="flex min-h-11 w-full cursor-pointer items-center gap-3 border-b border-[var(--kodo-border)] px-3 py-2 text-left last:border-b-0 hover:bg-[var(--kodo-hover-strong)]"
              >
                <span aria-hidden className="text-2xl leading-none">{flag(c.code)}</span>
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
