// Felles JSON-svar for API-rutene: aldri bufret, feil som KODE (klienten oversetter).
import "server-only";
import type { ErrorCode } from "./types";
import type { WriteResult } from "./store";

const NO_STORE = { "Cache-Control": "no-store" };

export function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: NO_STORE });
}

export function error(code: ErrorCode, status: number, extra?: object): Response {
  return json({ error: code, ...extra }, status);
}

/** Skrive-resultat fra store → 200/201, 404 eller 409 (score opptatt). */
export function writeResponse(r: WriteResult, okStatus = 200): Response {
  if (r.ok) return json({ id: r.id }, okStatus);
  if (r.error === "score_taken") return error("score_taken", 409, { holder: r.holder });
  return error("not_found", 404);
}

export function serverError(where: string, e: unknown): Response {
  console.error(`[api] ${where}`, e);
  return error("server_error", 500);
}
