import { NextResponse } from "next/server";
import { createClient, getServiceRoleClient } from "@/lib/supabase/server";
import { processContentById } from "@/services/ingest";
import { createOpenRouterProvider } from "@/core/ai/openrouter-provider";
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  AIProviderError,
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

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const serviceClient = getServiceRoleClient();
    const ai = createOpenRouterProvider();
    const result = await processContentById(serviceClient, ai, id);
    return NextResponse.json({ status: "done", ...result });
  } catch (e) {
    if (e instanceof NotFoundError || e instanceof ValidationError) {
      return NextResponse.json({ error: e.message }, { status: e.statusCode });
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
