import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { UnauthorizedError } from "@/core/errors";
import { upsertView, getView } from "@/repositories/content-views";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new UnauthorizedError();

    const view = await getView(supabase, user.id, id);
    return NextResponse.json({
      viewed: view !== null,
      first_viewed_at: view?.first_viewed_at ?? null,
      last_viewed_at: view?.last_viewed_at ?? null,
      view_count: view?.view_count ?? null,
    });
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw e;
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new UnauthorizedError();

    await upsertView(supabase, user.id, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw e;
  }
}
