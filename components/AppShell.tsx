"use client";

// Rammen rundt sidene: topprad (navn, språk, meny på desktop), personvelger,
// footer og bunnlinje på mobil. Spør «Hvem er du?» første gang på en enhet.
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { List, Plane, Plus } from "lucide-react";
import { cn } from "@kodo/shared";
import { BarLabel, kodoBarItem, kodoButtonPrimary, LanguagePicker, MobileBottomBar, useLocale } from "@kodo/shared/ui";
import { PEOPLE, type Person } from "@/lib/types";
import { usePerson } from "./PersonProvider";

function PersonSwitch() {
  const { t } = useLocale();
  const { person, setPerson } = usePerson();
  return (
    <div className="inline-flex rounded-full border border-[var(--kodo-border-strong)] p-0.5">
      {PEOPLE.map((p) => (
        <button
          key={p}
          type="button"
          aria-pressed={person === p}
          onClick={() => setPerson(p)}
          className={cn(
            "min-h-9 cursor-pointer rounded-full px-4 text-sm font-semibold transition",
            person === p ? "text-[var(--kodo-bg)]" : "text-[var(--kodo-muted)] hover:text-[var(--kodo-text)]",
          )}
          style={person === p ? { backgroundColor: "var(--kodo-accent)" } : undefined}
        >
          {t(`person.${p}`)}
        </button>
      ))}
    </div>
  );
}

function PersonGate({ onPick }: { onPick: (p: Person) => void }) {
  const { t } = useLocale();
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[var(--kodo-overlay)] p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="person-gate-title"
        className="w-full max-w-sm rounded-2xl border border-[var(--kodo-border-strong)] bg-[var(--kodo-surface-modal)] p-6 text-center"
      >
        <h2 id="person-gate-title" className="text-xl font-semibold">{t("person.gate_title")}</h2>
        <p className="mt-2 text-sm text-[var(--kodo-muted)]">{t("person.gate_text")}</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {PEOPLE.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPick(p)}
              className={cn(kodoButtonPrimary, "min-h-12 text-base")}
              style={{ backgroundColor: "var(--kodo-blue)" }}
            >
              {t(`person.${p}`)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AppShell({ version, children }: { version: string; children: ReactNode }) {
  const { t } = useLocale();
  const { person, setPerson } = usePerson();
  const pathname = usePathname();
  const nav = [
    { href: "/", label: t("nav.overview"), short: t("nav.overview"), Icon: List },
    { href: "/ny", label: t("nav.new"), short: t("nav.new_short"), Icon: Plus },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[var(--kodo-border)] bg-[var(--kodo-bg)] pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 pt-3">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <Plane aria-hidden className="h-5 w-5" style={{ color: "var(--kodo-accent)" }} />
            {t("app.name")}
          </Link>
          <nav aria-label={t("nav.label")} className="hidden gap-1 sm:flex">
            {nav.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={pathname === href ? "page" : undefined}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition hover:bg-[var(--kodo-hover-strong)]",
                  pathname === href ? "text-[var(--kodo-accent)]" : "text-[var(--kodo-muted)]",
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
          <LanguagePicker size="sm" />
        </div>
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--kodo-muted)]">{t("person.label")}</span>
          <PersonSwitch />
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-5">{children}</main>

      <footer className="px-4 py-6 text-center text-xs text-[var(--kodo-muted)]">
        {t("footer.brand")} {version}
      </footer>

      <MobileBottomBar label={t("nav.label")}>
        {nav.map(({ href, short, Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={pathname === href ? "page" : undefined}
            className={cn(kodoBarItem, pathname === href && "text-[var(--kodo-accent)]")}
          >
            <Icon aria-hidden />
            <BarLabel>{short}</BarLabel>
          </Link>
        ))}
      </MobileBottomBar>

      {person === null && <PersonGate onPick={setPerson} />}
    </>
  );
}
