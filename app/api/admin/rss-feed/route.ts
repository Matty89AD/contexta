import { NextResponse } from "next/server";
import { createClient, getServiceRoleClient } from "@/lib/supabase/server";
import { extractRssFeed } from "@/services/url-metadata.service";
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

/** GET /api/admin/rss-feed?url=... — parse RSS feed and return episodes (no job created) */
export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    if (!url) throw new ValidationError("url query parameter is required");
    const feedData = await extractRssFeed(url);
    return NextResponse.json(feedData);
  } catch (e) {
    if (e instanceof AppError) {
      return NextResponse.json({ error: e.message }, { status: e.statusCode });
    }
    throw e;
  }
}
