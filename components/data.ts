"use client";

// Klientside data: henter lista (på nytt ved fokus, så endringer fra den andre
// telefonen dukker opp) og sender endringer. Feil kommer som KODE → t(`error.${kode}`).
import { useCallback, useEffect, useState } from "react";
import type { Destination, ErrorCode } from "@/lib/types";

export type ClientError = ErrorCode | "network_error";
export type SendResult = { ok: true } | { ok: false; error: ClientError };

export async function send(method: "POST" | "PUT" | "DELETE", path: string, body?: unknown): Promise<SendResult> {
  try {
    const r = await fetch(path, {
      method,
      headers: body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (r.ok) return { ok: true };
    const data = (await r.json().catch(() => null)) as { error?: ErrorCode } | null;
    return { ok: false, error: data?.error ?? "server_error" };
  } catch {
    return { ok: false, error: "network_error" };
  }
}

/** Lista, eller null ved feil. */
async function fetchList(): Promise<Destination[] | null> {
  try {
    const r = await fetch("/api/destinations", { cache: "no-store" });
    if (!r.ok) return null;
    return ((await r.json()) as { destinations: Destination[] }).destinations;
  } catch {
    return null;
  }
}

export function useDestinations() {
  const [list, setList] = useState<Destination[] | null>(null);
  const [failed, setFailed] = useState(false);

  // State settes kun i .then-tilbakekall (asynkront), aldri direkte i effekten.
  const apply = useCallback((l: Destination[] | null) => {
    if (l) setList(l);
    setFailed(l === null);
  }, []);
  const reload = useCallback(() => fetchList().then(apply), [apply]);

  useEffect(() => {
    void fetchList().then(apply);
    const onFocus = () => void reload();
    const onVisible = () => document.visibilityState === "visible" && void reload();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [apply, reload]);

  return { list, failed, reload };
}
