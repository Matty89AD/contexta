import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { UnauthorizedError } from "@/core/errors";
import { getViewedContentCount } from "@/repositories/content-views";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new UnauthorizedError();

    const viewedContentCount = await getViewedContentCount(supabase, user.id);
    return NextResponse.json({ viewedContentCount });
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw e;
  }
}
