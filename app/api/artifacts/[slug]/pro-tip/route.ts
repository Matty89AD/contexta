import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { getArtifactBySlug } from "@/repositories/artifacts";
import { getChallengeById } from "@/repositories/challenges";
import { generateProTip } from "@/services/artifact-detail";
import { createOpenRouterProvider } from "@/core/ai/openrouter-provider";
import { NotFoundError, AppError } from "@/core/errors";
import { checkRateLimit, getClientIp, rateLimitedResponse } from "@/lib/rate-limit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const rl = checkRateLimit(getClientIp(request), 10, 60_000);
  if (!rl.allowed) return rateLimitedResponse(rl.resetMs);

  try {
    const { slug } = await params;
    const body = await request.json().catch(() => ({}));
    const { challengeId } = body as { challengeId?: string };

    if (!challengeId) {
      return NextResponse.json({ pro_tip: null });
    }

    const supabase = getServiceRoleClient();
    const [artifact, challenge] = await Promise.all([
      getArtifactBySlug(supabase, slug),
      getChallengeById(supabase, challengeId),
    ]);

    if (!artifact) throw new NotFoundError(`Artifact not found: ${slug}`);
    if (!challenge?.summary) {
      return NextResponse.json({ pro_tip: null });
    }

    const ai = createOpenRouterProvider();
    const pro_tip = await generateProTip(
      artifact,
      ai,
      challenge.summary,
      challenge.domains
    );

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
