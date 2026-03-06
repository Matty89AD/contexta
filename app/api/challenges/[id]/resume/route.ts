import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { UnauthorizedError, NotFoundError } from "@/core/errors";
import { getChallengeById } from "@/repositories/challenges";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new UnauthorizedError();

    const challenge = await getChallengeById(supabase, id);
    if (!challenge || challenge.user_id !== user.id) {
      throw new NotFoundError("Challenge not found");
    }

    return NextResponse.json({
      id: challenge.id,
      summary: challenge.summary,
      problem_statement: challenge.problem_statement,
      desired_outcome_statement: challenge.desired_outcome_statement,
      domains: challenge.domains,
      raw_description: challenge.raw_description,
    });
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
