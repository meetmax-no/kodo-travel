"use client";

// Hvem som bruker denne enheten (Anita/Michael). Ingen innlogging: valget huskes
// i nettleseren (localStorage) og kan byttes når som helst. Faller tilbake til
// minnet hvis lagring er avslått (f.eks. privat modus).
import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { isPerson, type Person } from "@/lib/types";

const KEY = "dream-travel-person";
const EVENT = "dream-travel-person";
let memory: Person | null = null;

function read(): Person | null {
  try {
    const v = window.localStorage.getItem(KEY);
    if (isPerson(v)) return v;
  } catch {
    /* lagring avslått — bruk minnet */
  }
  return memory;
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

interface PersonContextValue {
  /** undefined = ikke lest ennå (server/første render), null = ikke valgt på enheten. */
  person: Person | null | undefined;
  setPerson: (p: Person) => void;
}

const PersonContext = createContext<PersonContextValue | null>(null);

export function PersonProvider({ children }: { children: ReactNode }) {
  const person = useSyncExternalStore(subscribe, read, () => undefined);
  const setPerson = useCallback((p: Person) => {
    memory = p;
    try {
      window.localStorage.setItem(KEY, p);
    } catch {
      /* lagring avslått — minnet holder resten av økta */
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);
  const value = useMemo(() => ({ person, setPerson }), [person, setPerson]);
  return <PersonContext.Provider value={value}>{children}</PersonContext.Provider>;
}

export function usePerson(): PersonContextValue {
  const ctx = useContext(PersonContext);
  if (!ctx) throw new Error("usePerson() må brukes innenfor <PersonProvider>."); // i18n-ok (utviklerfeil, ikke UI)
  return ctx;
}
