"use client";
import { LanguagePicker, useLocale } from "@kodo/shared/ui";

export default function Home() {
  const { t } = useLocale();

  return (
    <>
      <header className="flex items-center justify-end border-b border-[var(--kodo-border)] px-6 py-4">
        <LanguagePicker />
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-16">
        <h1 className="mb-4 text-4xl font-semibold tracking-tight">{t("travel.title")}</h1>
        <p className="max-w-prose text-lg text-[var(--kodo-muted)]">{t("travel.subtitle")}</p>
      </main>
    </>
  );
}
