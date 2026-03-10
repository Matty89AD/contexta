import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { getArtifactBySlug } from "@/repositories/artifacts";
import { generateArtifactDetail } from "@/services/artifact-detail";
import { createOpenRouterProvider } from "@/core/ai/openrouter-provider";
import { NotFoundError, AIProviderError, AppError } from "@/core/errors";
import { logger } from "@/core/logger";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = getServiceRoleClient();
    const artifact = await getArtifactBySlug(supabase, slug);
    if (!artifact) throw new NotFoundError(`Artifact not found: ${slug}`);

    const ai = createOpenRouterProvider();
    const detail = await generateArtifactDetail(supabase, artifact, ai);

    return NextResponse.json(detail);
  } catch (e) {
    if (e instanceof NotFoundError) {
      return NextResponse.json({ error: e.message }, { status: 404 });
    }
    if (e instanceof AIProviderError) {
      logger.error("Artifact detail AI error", { slug: "unknown", error: e.message });
      return NextResponse.json({ error: "AI service temporarily unavailable" }, { status: 502 });
    }
    if (e instanceof AppError) {
      return NextResponse.json({ error: e.message }, { status: e.statusCode });
    }
    throw e;
  }
}
