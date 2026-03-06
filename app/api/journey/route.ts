import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { UnauthorizedError } from "@/core/errors";
import { getJourneyData } from "@/services/journey";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new UnauthorizedError();

    const data = await getJourneyData(supabase, user.id);
    return NextResponse.json(data);
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }
}
