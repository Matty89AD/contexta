import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { runChallengePhase2 } from "@/services/challenge";
import { createOpenRouterProvider } from "@/core/ai/openrouter-provider";
import { NotFoundError, AIProviderError, AppError } from "@/core/errors";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getServiceRoleClient();
    const ai = createOpenRouterProvider();
    const result = await runChallengePhase2(supabase, ai, id);
    return NextResponse.json(result);
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
