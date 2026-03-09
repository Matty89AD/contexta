import { NextResponse } from "next/server";
import { createClient, getServiceRoleClient } from "@/lib/supabase/server";
import { listRecentNotifications, markAllRead } from "@/repositories/admin-notifications";
import { UnauthorizedError, ForbiddenError, AppError } from "@/core/errors";

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
    const notifications = await listRecentNotifications(serviceClient);
    return NextResponse.json(notifications);
  } catch (e) {
    if (e instanceof AppError) {
      return NextResponse.json({ error: e.message }, { status: e.statusCode });
    }
    throw e;
  }
}

export async function PATCH() {
  try {
    await requireAdmin();
    const serviceClient = getServiceRoleClient();
    await markAllRead(serviceClient);
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof AppError) {
      return NextResponse.json({ error: e.message }, { status: e.statusCode });
    }
    throw e;
  }
}
