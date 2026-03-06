import { NextResponse } from "next/server";
import { createClient, getServiceRoleClient } from "@/lib/supabase/server";
import { NotFoundError, UnauthorizedError, AppError } from "@/core/errors";

export async function PATCH(
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

    const serviceClient = getServiceRoleClient();
    const { data: challenge, error: fetchError } = await serviceClient
      .from("challenges")
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (fetchError || !challenge) throw new NotFoundError("Challenge not found");

    // Idempotent: already claimed by this user.
    if ((challenge as { user_id: string | null }).user_id === user.id) {
      return NextResponse.json({ success: true });
    }

    // Already claimed by a different user.
    if ((challenge as { user_id: string | null }).user_id !== null) {
      throw new AppError("Challenge already claimed by another account", "CONFLICT", 409);
    }

    const { error: updateError } = await serviceClient
      .from("challenges")
      .update({ user_id: user.id })
      .eq("id", id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    if (e instanceof NotFoundError) {
      return NextResponse.json({ error: e.message }, { status: 404 });
    }
    if (e instanceof AppError) {
      return NextResponse.json({ error: e.message }, { status: e.statusCode });
    }
    throw e;
  }
}
