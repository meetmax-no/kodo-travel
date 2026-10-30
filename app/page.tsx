"use client";

// Oversikt: felles topp 3, Anitas topp 3, Michaels topp 3 — så alle reisemål (nyeste først).
import { useState } from "react";
import Link from "next/link";
import { kodoButtonPrimary, kodoButtonSecondary, useLocale } from "@kodo/shared/ui";
import { DestinationDialog } from "@/components/DestinationDialog";
import { DestinationRow, TopSection } from "@/components/DestinationViews";
import { useDestinations } from "@/components/data";
import { usePerson } from "@/components/PersonProvider";
import { topCommon, topForPerson } from "@/lib/ranking";

export default function Overview() {
  const { t } = useLocale();
  const { person } = usePerson();
  const { list, failed, reload } = useDestinations();
  const [openId, setOpenId] = useState<string | null>(null);

  if (!list) {
    return failed ? (
      <div className="space-y-3 text-center">
        <p className="text-[var(--kodo-muted)]">{t("error.load")}</p>
        <button type="button" className={kodoButtonSecondary} onClick={() => void reload()}>
          {t("common.retry")}
        </button>
      </div>
    ) : (
      <p className="text-center text-[var(--kodo-muted)]">{t("common.loading")}</p>
    );
  }

  const newestFirst = [...list].reverse();

  return (
    <div className="space-y-7">
      <TopSection
        title={t("top.common")}
        items={topCommon(list)}
        empty={t("top.common_empty")}
        score={(d) => `${d.scores.anita} + ${d.scores.michael} = ${d.scores.anita! + d.scores.michael!}`}
        onOpen={setOpenId}
      />
      <TopSection
        title={t("top.anita")}
        items={topForPerson(list, "anita")}
        empty={t("top.empty")}
        score={(d) => d.scores.anita}
        onOpen={setOpenId}
      />
      <TopSection
        title={t("top.michael")}
        items={topForPerson(list, "michael")}
        empty={t("top.empty")}
        score={(d) => d.scores.michael}
        onOpen={setOpenId}
      />

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--kodo-muted)]">{t("list.title")}</h2>
        {newestFirst.length === 0 ? (
          <div className="space-y-3 rounded-xl border border-dashed border-[var(--kodo-border-strong)] p-4 text-center">
            <p className="text-sm text-[var(--kodo-muted)]">{t("list.empty")}</p>
            <Link href="/ny" className={kodoButtonPrimary} style={{ backgroundColor: "var(--kodo-blue)" }}>
              {t("nav.new")}
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {newestFirst.map((d) => (
              <li key={d.id}>
                <DestinationRow d={d} onOpen={setOpenId} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <DestinationDialog
        d={list.find((d) => d.id === openId) ?? null}
        list={list}
        person={person}
        onClose={() => setOpenId(null)}
        onChanged={reload}
      />
    </div>
  );
}
