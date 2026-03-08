import { NextResponse } from "next/server";
import { createClient, getServiceRoleClient } from "@/lib/supabase/server";
import * as adminRepo from "@/repositories/admin";
import { UnauthorizedError, ForbiddenError, ValidationError, AppError } from "@/core/errors";

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

export async function GET() {
  try {
    await requireAdmin();
    const serviceClient = getServiceRoleClient();
    const posts = await adminRepo.listNews(serviceClient);
    return NextResponse.json(posts);
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
    if (!body.type || !body.title || !body.description || !body.published_date) {
      throw new ValidationError("type, title, description, and published_date are required");
    }
    const serviceClient = getServiceRoleClient();
    const post = await adminRepo.createNews(serviceClient, body);
    return NextResponse.json(post, { status: 201 });
  } catch (e) {
    if (e instanceof AppError) {
      return NextResponse.json({ error: e.message }, { status: e.statusCode });
    }
    throw e;
  }
}
