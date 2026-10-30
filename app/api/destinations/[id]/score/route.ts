// PUT { person, score }: sett personens score (1–10) — eller fjern den med score: null.
import { error, serverError, writeResponse } from "@/lib/http";
import { ID_PATTERN, setScore } from "@/lib/store";
import { isPerson } from "@/lib/types";
import { validateScore } from "@/lib/validate";

export async function PUT(req: Request, ctx: RouteContext<"/api/destinations/[id]/score">) {
  const { id } = await ctx.params;
  if (!ID_PATTERN.test(id)) return error("not_found", 404);
  const body = (await req.json().catch(() => null)) as { person?: unknown; score?: unknown } | null;
  if (!body) return error("invalid_body", 400);
  if (!isPerson(body.person)) return error("invalid_person", 400);
  const score = body.score ?? null;
  if (!validateScore(score)) return error("invalid_score", 400);
  try {
    return writeResponse(await setScore(id, body.person, score));
  } catch (e) {
    return serverError("PUT /api/destinations/[id]/score", e);
  }
}
