import { NextResponse } from "next/server";
import { createClient, getServiceRoleClient } from "@/lib/supabase/server";
import {
  listArtifactsAdmin,
  createArtifact,
} from "@/repositories/artifacts";
import { UnauthorizedError, ForbiddenError, ValidationError, AppError } from "@/core/errors";
import type { ArtifactStatus, ChallengeDomain } from "@/lib/db/types";

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

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as ArtifactStatus | null;
    const domain = searchParams.get("domain") as ChallengeDomain | null;
    const is_ai_generated = searchParams.get("is_ai_generated");
    const page = parseInt(searchParams.get("page") ?? "1", 10);

    const serviceClient = getServiceRoleClient();
    const result = await listArtifactsAdmin(serviceClient, {
      status: status ?? undefined,
      domain: domain ?? undefined,
      is_ai_generated:
        is_ai_generated === "true" ? true : is_ai_generated === "false" ? false : undefined,
      page,
    });
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof AppError) {
      return NextResponse.json({ error: e.message }, { status: e.statusCode });
    }
    throw e;
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    if (!body.slug || !body.title || !body.use_case) {
      throw new ValidationError("slug, title, and use_case are required");
    }
    const serviceClient = getServiceRoleClient();
    const artifact = await createArtifact(serviceClient, {
      slug: body.slug,
      title: body.title,
      domains: body.domains ?? [],
      use_case: body.use_case,
      detail: body.detail ?? null,
      status: body.status ?? "active",
      is_ai_generated: false,
    });
    return NextResponse.json(artifact, { status: 201 });
  } catch (e) {
    if (e instanceof AppError) {
      return NextResponse.json({ error: e.message }, { status: e.statusCode });
    }
    throw e;
  }
}
