import { NextResponse } from "next/server";
import { createClient, getServiceRoleClient } from "@/lib/supabase/server";
import * as adminRepo from "@/repositories/admin";
import { UnauthorizedError, ForbiddenError, ValidationError, AppError } from "@/core/errors";
import type { ContentStatus, ContentSourceType, ChallengeDomain } from "@/lib/db/types";

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
    const filters: adminRepo.ContentFilters = {
      status: (searchParams.get("status") as ContentStatus) || undefined,
      source_type: (searchParams.get("source_type") as ContentSourceType) || undefined,
      domain: (searchParams.get("domain") as ChallengeDomain) || undefined,
      page: Number(searchParams.get("page") ?? "1"),
      limit: Number(searchParams.get("limit") ?? "50"),
    };
    const serviceClient = getServiceRoleClient();
    const result = await adminRepo.listContent(serviceClient, filters);
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
    if (!body.source_type || !body.url) {
      throw new ValidationError("source_type and url are required");
    }
    const serviceClient = getServiceRoleClient();
    const content = await adminRepo.createContent(serviceClient, {
      source_type: body.source_type,
      url: body.url,
      title: body.title,
      transcript_raw: body.transcript_raw,
    });
    return NextResponse.json(content, { status: 201 });
  } catch (e) {
    if (e instanceof AppError) {
      return NextResponse.json({ error: e.message }, { status: e.statusCode });
    }
    throw e;
  }
}
