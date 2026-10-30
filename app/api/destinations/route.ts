// GET: alle reisemål med score · POST: nytt reisemål (evt. med score fra den som legger inn).
import { connection } from "next/server";
import { error, json, serverError, writeResponse } from "@/lib/http";
import { createDestination, listDestinations } from "@/lib/store";
import { validateNew } from "@/lib/validate";

export async function GET() {
  await connection(); // aldri prerendret — leses fra Redis ved hver forespørsel
  try {
    return json({ destinations: await listDestinations() });
  } catch (e) {
    return serverError("GET /api/destinations", e);
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const v = validateNew(body);
  if (!v.ok) return error(v.error, 400);
  try {
    return writeResponse(await createDestination(v.value), 201);
  } catch (e) {
    return serverError("POST /api/destinations", e);
  }
}
