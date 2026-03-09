import { NextResponse } from "next/server";
import { createClient, getServiceRoleClient } from "@/lib/supabase/server";
import { getArtifactById } from "@/repositories/artifacts";
import { detectArtifactsFromContent } from "@/services/artifact-detection";
import { createOpenRouterProvider } from "@/core/ai/openrouter-provider";
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  AppError,
} from "@/core/errors";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new UnauthorizedError();

  const serviceClient = getServiceRoleClient();
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) throw new ForbiddenError();
  return user;
}

/**
 * POST /api/admin/artifacts/[id]/detect
 * Re-run artifact detection from the artifact's source_content_id.
 * The [id] here is actually the content item id (not artifact id) — used from content edit page.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const serviceClient = getServiceRoleClient();

    // Verify content exists
    const { data: content } = await serviceClient
      .from("content")
      .select("id, title")
      .eq("id", id)
      .single();

    if (!content) throw new NotFoundError(`Content ${id} not found`);

    const ai = createOpenRouterProvider();
    const result = await detectArtifactsFromContent(id, ai, serviceClient);

    return NextResponse.json({ status: "done", count: result.count });
  } catch (e) {
    if (e instanceof AppError) {
      return NextResponse.json({ error: e.message }, { status: e.statusCode });
    }
    throw e;
  }
}
