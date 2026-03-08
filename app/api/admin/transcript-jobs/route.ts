import { NextResponse } from "next/server";
import { unstable_after as after } from "next/server";
import { createClient, getServiceRoleClient } from "@/lib/supabase/server";
import { createJob, processJob, listJobs } from "@/services/transcript-job.service";
import { createOpenRouterIngestProvider } from "@/core/ai/openrouter-provider";
import {
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
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

/** POST /api/admin/transcript-jobs — create a new transcript job */
export async function POST(request: Request) {
  try {
    const user = await requireAdmin();
    const body = await request.json();
    const { url } = body as { url?: string };

    const serviceClient = getServiceRoleClient();
    const result = await createJob(serviceClient, url ?? "", user.id);

    // Schedule background processing via after() (non-blocking)
    after(async () => {
      const bgClient = getServiceRoleClient();
      const ai = createOpenRouterIngestProvider();
      await processJob(bgClient, ai, result.jobId);
    });

    return NextResponse.json(result, { status: 202 });
  } catch (e) {
    if (e instanceof ValidationError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    if (e instanceof AppError) {
      return NextResponse.json({ error: e.message }, { status: e.statusCode });
    }
    throw e;
  }
}

/** GET /api/admin/transcript-jobs — list recent jobs, or look up by ?content_id= */
export async function GET(request: Request) {
  try {
    const user = await requireAdmin();
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get("content_id");
    const serviceClient = getServiceRoleClient();

    if (contentId) {
      const { findJobByContentId } = await import("@/repositories/transcript-jobs.repository");
      const job = await findJobByContentId(serviceClient, contentId);
      return NextResponse.json(job ?? null);
    }

    const jobs = await listJobs(serviceClient, user.id);
    return NextResponse.json(jobs);
  } catch (e) {
    if (e instanceof AppError) {
      return NextResponse.json({ error: e.message }, { status: e.statusCode });
    }
    throw e;
  }
}
