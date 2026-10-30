"use client";

// Splash ved hver oppstart (full sidelasting): rendres i server-HTML-en, så den
// vises før JS er lastet, og tones ut av CSS etter 1,5 s (.splash i globals.css) —
// tidtakingen avhenger ikke av JS. Trykk hopper over. Klientnavigering beholder
// layouten, så den vises ikke på nytt.
// Bildet (1440×3120) går via next/image: riktig størrelse/format per skjerm, og en
// uskarp forhåndsvisning (blurDataURL fra statisk import) til det er lastet.
import { useState } from "react";
import Image from "next/image";
import { useLocale } from "@kodo/shared/ui";
import splash from "@/public/splash.jpg";

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
      className="splash fixed inset-0 z-[200] cursor-pointer border-0 bg-[var(--kodo-bg)] p-0"
    >
      {/* Stående bilde: på brede skjermer beskjæres høyden — utsnittet litt ned så sjøflyet er med. */}
      <Image
        src={splash}
        alt=""
        fill
        priority
        sizes="100vw"
        placeholder="blur" // i18n-ok (next/image-modus, ikke tekst)
        className="object-cover"
        style={{ objectPosition: "50% 62%" }}
      />
    </button>
  );
}
