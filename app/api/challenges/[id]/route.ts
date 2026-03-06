import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { UnauthorizedError, NotFoundError, ValidationError } from "@/core/errors";
import { getChallengeById } from "@/repositories/challenges";
import { saveChallengeResult, autoTitle } from "@/services/challenge";
import { updateChallengeTitle } from "@/repositories/challenges";
import type { ArtifactRecommendation } from "@/lib/db/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new UnauthorizedError();

    const challenge = await getChallengeById(supabase, id);
    if (!challenge || challenge.user_id !== user.id) {
      throw new NotFoundError("Challenge not found");
    }
    if (!challenge.is_saved) {
      throw new NotFoundError("Challenge not found");
    }

    return NextResponse.json(challenge);
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    if (e instanceof NotFoundError) {
      return NextResponse.json({ error: e.message }, { status: 404 });
    }
    throw e;
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new UnauthorizedError();

    const body = await request.json() as {
      is_saved?: boolean;
      title?: string;
      recommendations?: ArtifactRecommendation[];
    };

    if (body.is_saved) {
      // Save challenge with recommendations
      if (!Array.isArray(body.recommendations)) {
        throw new ValidationError("recommendations is required when saving");
      }
      const challenge = await getChallengeById(supabase, id);
      const titleToUse = body.title?.trim() || autoTitle(challenge?.raw_description ?? "Challenge");
      await saveChallengeResult(supabase, id, user.id, {
        title: titleToUse,
        recommendations: body.recommendations,
      });
    } else if (body.title !== undefined) {
      // Rename only
      const challenge = await getChallengeById(supabase, id);
      if (!challenge || challenge.user_id !== user.id) {
        throw new NotFoundError("Challenge not found");
      }
      const trimmed = body.title.trim();
      if (!trimmed) throw new ValidationError("title cannot be empty");
      await updateChallengeTitle(supabase, id, trimmed);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    if (e instanceof NotFoundError) {
      return NextResponse.json({ error: e.message }, { status: 404 });
    }
    if (e instanceof ValidationError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }
}
