"use client";

// Splash ved hver oppstart (full sidelasting): rendres i server-HTML-en, så den
// vises før JS er lastet, og tones ut av CSS etter 1,5 s (.splash i globals.css).
// Trykk hopper over. Klientnavigering beholder layouten, så den vises ikke på nytt.
// Midlertidig grafikk — byttes til bildet (public/splash.jpg) når det er klart.
import { useState } from "react";
import { Plane } from "lucide-react";
import { useLocale } from "@kodo/shared/ui";

export function Splash() {
  const { t } = useLocale();
  const [gone, setGone] = useState(false);
  if (gone) return null;
  return (
    <button
      type="button"
      aria-label={t("splash.skip")}
      onClick={() => setGone(true)}
      onAnimationEnd={() => setGone(true)}
      className="splash fixed inset-0 z-[200] flex cursor-pointer flex-col items-center justify-center gap-4 border-0 p-0 text-[var(--kodo-text)]"
      style={{
        background:
          "radial-gradient(120% 80% at 50% 0%, var(--kodo-accent-soft), transparent 60%), radial-gradient(100% 70% at 50% 100%, var(--kodo-tint-blue-bg), transparent 60%), var(--kodo-bg)",
      }}
    >
      <Plane aria-hidden className="h-16 w-16" style={{ color: "var(--kodo-accent)" }} />
      <span className="text-3xl font-semibold tracking-tight">{t("app.name")}</span>
    </button>
  );
}
