import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { getArtifactBySlug } from "@/repositories/artifacts";
import { generateProTip } from "@/services/artifact-detail";
import { createOpenRouterProvider } from "@/core/ai/openrouter-provider";
import { NotFoundError, AppError } from "@/core/errors";

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

    if (!challengeSummary) {
      return NextResponse.json({ pro_tip: null });
    }

    const supabase = getServiceRoleClient();
    const artifact = await getArtifactBySlug(supabase, slug);
    if (!artifact) throw new NotFoundError(`Artifact not found: ${slug}`);

    const ai = createOpenRouterProvider();
    const pro_tip = await generateProTip(artifact, ai, challengeSummary, challengeDomains);

    return NextResponse.json({ pro_tip });
  } catch (e) {
    if (e instanceof NotFoundError) {
      return NextResponse.json({ error: e.message }, { status: 404 });
    }
    if (e instanceof AppError) {
      return NextResponse.json({ error: e.message }, { status: e.statusCode });
    }
    throw e;
  }
}
