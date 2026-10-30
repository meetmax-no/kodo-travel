"use client";

// Detaljer for ett reisemål: begges score, sett/fjern egen score, åpne lenke, slett.
import { useState } from "react";
import { ExternalLink, Trash2 } from "lucide-react";
import { ConfirmDialog, Dialog, kodoButtonSecondary, kodoLabel, useLocale } from "@kodo/shared/ui";
import { countryName, flag } from "@/lib/countries";
import type { Destination, Person } from "@/lib/types";
import { send } from "./data";
import { linkHost, timeLabel, usedScores } from "./format";
import { ScorePicker } from "./ScorePicker";

export function DestinationDialog({
  d,
  list,
  person,
  onClose,
  onChanged,
}: {
  d: Destination | null;
  list: Destination[];
  person: Person | null | undefined;
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const { t, locale } = useLocale();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const close = () => {
    setError(null);
    setConfirmDelete(false);
    onClose();
  };

  async function run(method: "PUT" | "DELETE", path: string, body?: unknown, closeAfter = false) {
    setBusy(true);
    setError(null);
    const r = await send(method, path, body);
    await onChanged();
    setBusy(false);
    if (!r.ok) setError(t(`error.${r.error}`));
    else if (closeAfter) close();
  }

  if (!d) return null;
  const when = timeLabel(d, locale, t("time.week"));
  const mine = person ? (d.scores[person] ?? null) : null;

  return (
    <>
      <Dialog open title={d.place} closeLabel={t("common.close")} onClose={close}>
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <span aria-hidden className="text-4xl leading-none">{flag(d.country)}</span>
            <div>
              <div className="font-semibold">{countryName(d.country, locale)}</div>
              {when && <div className="text-sm text-[var(--kodo-muted)]">{when}</div>}
              <div className="text-xs text-[var(--kodo-muted)]">
                {t("list.added_by")} {t(`person.${d.addedBy}`)}
              </div>
            </div>
          </div>

          {d.link && (
            <a href={d.link} target="_blank" rel="noopener noreferrer" className={kodoButtonSecondary}>
              <ExternalLink className="h-4 w-4" aria-hidden />
              {t("dialog.open_link")} · {linkHost(d.link)}
            </a>
          )}

          <div>
            <div className={kodoLabel}>{t("dialog.scores")}</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {(["anita", "michael"] as const).map((p) => (
                <div key={p} className="rounded-lg border border-[var(--kodo-border)] px-3 py-2">
                  <div className="text-xs text-[var(--kodo-muted)]">{t(`person.${p}`)}</div>
                  <div className="text-lg font-semibold tabular-nums">{d.scores[p] ?? "–"}</div>
                </div>
              ))}
            </div>
          </div>

          {person && (
            <div>
              <div className={kodoLabel}>{t("dialog.your_score")}</div>
              <ScorePicker
                value={mine}
                used={usedScores(list, person, d.id)}
                disabled={busy}
                onPick={(s) => run("PUT", `/api/destinations/${d.id}/score`, { person, score: s })}
              />
              {mine != null && (
                <button
                  type="button"
                  disabled={busy}
                  className={`${kodoButtonSecondary} mt-3`}
                  onClick={() => run("PUT", `/api/destinations/${d.id}/score`, { person, score: null })}
                >
                  {t("dialog.remove_score")}
                </button>
              )}
            </div>
          )}

          {error && (
            <p role="alert" className="rounded-lg bg-[var(--kodo-danger-bg)] px-3 py-2 text-sm text-[var(--kodo-tint-red-fg)]">
              {error}
            </p>
          )}

          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmDelete(true)}
            className={`${kodoButtonSecondary} w-full border-[var(--kodo-danger-border)] text-[var(--kodo-tint-red-fg)]`}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            {t("dialog.delete")}
          </button>
        </div>
      </Dialog>
      {/* Søsken (ikke inni Dialog): Dialog har backdrop-filter, som ellers låser fixed-posisjonen. */}
      <ConfirmDialog
        open={confirmDelete}
        title={t("dialog.delete_title")}
        message={d.place}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        danger
        busy={busy}
        onConfirm={() => run("DELETE", `/api/destinations/${d.id}`, undefined, true)}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
