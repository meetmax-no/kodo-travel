"use client";

// Score 1–10. Verdier personen allerede har brukt på andre reisemål er grået ut,
// og lista under viser hvor de er brukt (mobil har ingen hover).
import { cn } from "@kodo/shared";
import { useLocale } from "@kodo/shared/ui";

const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function ScorePicker({
  value,
  used,
  onPick,
  disabled,
}: {
  value: number | null;
  /** score → stedsnavn der personen allerede har brukt den. */
  used: Map<number, string>;
  onPick: (score: number) => void;
  disabled?: boolean;
}) {
  const { t } = useLocale();
  const usedList = [...used].sort((a, b) => b[0] - a[0]);

  return (
    <div>
      <div className="grid grid-cols-5 gap-2">
        {SCORES.map((s) => {
          const taken = used.has(s);
          const active = value === s;
          return (
            <button
              key={s}
              type="button"
              disabled={disabled || taken}
              aria-pressed={active}
              onClick={() => onPick(s)}
              className={cn(
                "h-11 cursor-pointer rounded-lg border text-base font-semibold transition disabled:cursor-not-allowed",
                active
                  ? "border-transparent text-[var(--kodo-bg)]"
                  : "border-[var(--kodo-border-strong)] bg-[var(--kodo-surface)] hover:bg-[var(--kodo-hover-strong)]",
                taken && "line-through opacity-30",
              )}
              style={active ? { backgroundColor: "var(--kodo-accent)" } : undefined}
            >
              {s}
            </button>
          );
        })}
      </div>
      {usedList.length > 0 && (
        <p className="mt-2 text-xs text-[var(--kodo-muted)]">
          {t("score.used")}: {usedList.map(([s, place]) => `${s} · ${place}`).join(", ")}
        </p>
      )}
      <p className="mt-1 text-xs text-[var(--kodo-muted)]">{t("score.hint")}</p>
    </div>
  );
}
