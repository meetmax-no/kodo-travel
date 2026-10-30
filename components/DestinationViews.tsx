"use client";

// Visning av reisemål: topp 3-seksjoner og rader i hele lista. Trykk åpner detaljer.
import type { ReactNode } from "react";
import { useLocale } from "@kodo/shared/ui";
import { countryName, flag } from "@/lib/countries";
import type { Destination } from "@/lib/types";
import { linkHost, timeLabel } from "./format";

const scoreText = (s: number | undefined) => (s == null ? "–" : String(s));

export function TopSection({
  title,
  items,
  empty,
  score,
  onOpen,
}: {
  title: string;
  items: Destination[];
  empty: string;
  score: (d: Destination) => ReactNode;
  onOpen: (id: string) => void;
}) {
  const { locale } = useLocale();
  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--kodo-muted)]">{title}</h2>
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--kodo-border-strong)] px-4 py-3 text-sm text-[var(--kodo-muted)]">
          {empty}
        </p>
      ) : (
        <ol className="overflow-hidden rounded-xl border border-[var(--kodo-border)] bg-[var(--kodo-surface)]">
          {items.map((d, i) => (
            <li key={d.id} className="border-b border-[var(--kodo-border)] last:border-b-0">
              <button
                type="button"
                onClick={() => onOpen(d.id)}
                className="flex min-h-14 w-full cursor-pointer items-center gap-3 px-3 py-2 text-left hover:bg-[var(--kodo-hover)]"
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-[var(--kodo-bg)]"
                  style={{ backgroundColor: "var(--kodo-accent)" }}
                >
                  {i + 1}
                </span>
                <span aria-hidden className="text-2xl leading-none">{flag(d.country)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{d.place}</span>
                  <span className="block truncate text-xs text-[var(--kodo-muted)]">{countryName(d.country, locale)}</span>
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums">{score(d)}</span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function DestinationRow({ d, onOpen }: { d: Destination; onOpen: (id: string) => void }) {
  const { t, locale } = useLocale();
  const when = timeLabel(d, locale, t("time.week"));
  return (
    <button
      type="button"
      onClick={() => onOpen(d.id)}
      className="flex w-full cursor-pointer items-start gap-3 rounded-xl border border-[var(--kodo-border)] bg-[var(--kodo-surface)] px-3 py-3 text-left hover:bg-[var(--kodo-hover)]"
    >
      <span aria-hidden className="pt-0.5 text-3xl leading-none">{flag(d.country)}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate font-semibold">{d.place}</span>
          <span className="shrink-0 text-xs tabular-nums text-[var(--kodo-muted)]">
            {t("person.anita_initial")} {scoreText(d.scores.anita)} · {t("person.michael_initial")}{" "}
            {scoreText(d.scores.michael)}
          </span>
        </span>
        <span className="block truncate text-sm text-[var(--kodo-muted)]">
          {countryName(d.country, locale)}
          {when && ` · ${when}`}
        </span>
        <span className="mt-1 flex items-center justify-between gap-2 text-xs text-[var(--kodo-muted)]">
          <span className="truncate">{d.link ? `${linkHost(d.link)} ↗` : ""}</span>
          <span className="shrink-0">
            {t("list.added_by")} {t(`person.${d.addedBy}`)}
          </span>
        </span>
      </span>
    </button>
  );
}
