import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { getArtifactBySlug } from "@/repositories/artifacts";
import { generateArtifactDetail } from "@/services/artifact-detail";
import { createOpenRouterProvider } from "@/core/ai/openrouter-provider";
import { NotFoundError, AIProviderError, AppError } from "@/core/errors";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json().catch(() => ({}));
    const { challengeSummary, challengeDomains } = body as {
      challengeSummary?: string;
      challengeDomains?: string[];
    };

    const supabase = getServiceRoleClient();
    const artifact = await getArtifactBySlug(supabase, slug);
    if (!artifact) throw new NotFoundError(`Artifact not found: ${slug}`);

    const ai = createOpenRouterProvider();
    const detail = await generateArtifactDetail(artifact, ai, challengeSummary, challengeDomains);

    return NextResponse.json(detail);
  } catch (e) {
    if (e instanceof NotFoundError) {
      return NextResponse.json({ error: e.message }, { status: 404 });
    }
    if (e instanceof AIProviderError) {
      return NextResponse.json({ error: e.message }, { status: 502 });
    }
    if (e instanceof AppError) {
      return NextResponse.json({ error: e.message }, { status: e.statusCode });
    }
    throw e;
  }
}
