"use client";
import { LocaleProvider } from "@kodo/shared/ui";
import no from "@/lib/locales/no.json";
import en from "@/lib/locales/en.json";

export function Providers({ children }: { children: React.ReactNode }) {
  return <LocaleProvider dicts={{ no, en }}>{children}</LocaleProvider>;
}
