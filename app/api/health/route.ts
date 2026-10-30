// Helsesjekk for NetStatus (@kodo/shared): { ok: true } når Redis svarer.
// Kun ok/ikke ok i svaret — ingen feildetaljer ut.
import { connection } from "next/server";
import { redis } from "@/lib/redis";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET() {
  await connection(); // aldri prerendret — Redis sjekkes ved hver forespørsel
  try {
    const ok = (await redis.ping()) === "PONG";
    return Response.json({ ok }, { status: ok ? 200 : 503, headers: NO_STORE });
  } catch {
    return Response.json({ ok: false }, { status: 503, headers: NO_STORE });
  }
}
