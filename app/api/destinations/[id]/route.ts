// DELETE: slett reisemålet og frigjør begges score for det.
import { error, serverError, writeResponse } from "@/lib/http";
import { deleteDestination, ID_PATTERN } from "@/lib/store";

export async function DELETE(_req: Request, ctx: RouteContext<"/api/destinations/[id]">) {
  const { id } = await ctx.params;
  if (!ID_PATTERN.test(id)) return error("not_found", 404);
  try {
    return writeResponse(await deleteDestination(id));
  } catch (e) {
    return serverError("DELETE /api/destinations/[id]", e);
  }
}
