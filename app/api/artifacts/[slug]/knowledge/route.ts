import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { getArtifactBySlug } from "@/repositories/artifacts";
import { getArtifactKnowledge } from "@/services/artifact-detail";
import { NotFoundError, AppError } from "@/core/errors";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = getServiceRoleClient();
    const artifact = await getArtifactBySlug(supabase, slug);
    if (!artifact) throw new NotFoundError(`Artifact not found: ${slug}`);

    const cards = await getArtifactKnowledge(supabase, artifact.title);
    return NextResponse.json({ cards });
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
