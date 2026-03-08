import { NextResponse } from "next/server";
import { createClient, getServiceRoleClient } from "@/lib/supabase/server";
import * as adminRepo from "@/repositories/admin";
import { UnauthorizedError, ForbiddenError, NotFoundError, AppError } from "@/core/errors";

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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const serviceClient = getServiceRoleClient();
    const content = await adminRepo.getContentById(serviceClient, id);
    if (!content) throw new NotFoundError(`Content ${id} not found`);
    return NextResponse.json(content);
  } catch (e) {
    if (e instanceof AppError) {
      return NextResponse.json({ error: e.message }, { status: e.statusCode });
    }
    throw e;
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const serviceClient = getServiceRoleClient();
    const content = await adminRepo.updateContent(serviceClient, id, body);
    return NextResponse.json(content);
  } catch (e) {
    if (e instanceof AppError) {
      return NextResponse.json({ error: e.message }, { status: e.statusCode });
    }
    throw e;
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const serviceClient = getServiceRoleClient();
    await adminRepo.deleteContent(serviceClient, id);
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof AppError) {
      return NextResponse.json({ error: e.message }, { status: e.statusCode });
    }
    // Guard error from repository (non-AppError)
    if (e instanceof Error && e.message.includes("Cannot delete")) {
      return NextResponse.json({ error: e.message }, { status: 409 });
    }
    throw e;
  }
}
