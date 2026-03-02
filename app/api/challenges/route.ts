import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/services/auth";
import { runChallengePipeline } from "@/services/challenge";
import { createOpenRouterProvider } from "@/core/ai/openrouter-provider";
import {
  AppError,
  ValidationError,
  AIProviderError,
} from "@/core/errors";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser().catch(() => null);
    const body = await request.json();
    const supabase = getServiceRoleClient();
    let ai;
    try {
      ai = createOpenRouterProvider();
    } catch (e) {
      const msg =
        e instanceof Error && e.message.includes("OPENROUTER_API_KEY")
          ? "Invalid or missing API key. Add a valid OPENROUTER_API_KEY to .env.local."
          : e instanceof Error
            ? e.message
            : "AI provider is not configured.";
      return NextResponse.json({ error: msg }, { status: 502 });
    }
    const result = await runChallengePipeline(
      supabase,
      ai,
      body,
      user?.id ?? null
    );
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof ValidationError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
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
