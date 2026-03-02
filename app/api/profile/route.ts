import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/services/auth";
import { createOrUpdateProfile } from "@/services/profile";
import {
  AppError,
  ValidationError,
  UnauthorizedError,
} from "@/core/errors";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError();
    }
    const body = await request.json();
    const supabase = await createClient();
    const profile = await createOrUpdateProfile(supabase, user.id, body);
    return NextResponse.json(profile);
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    if (e instanceof ValidationError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    if (e instanceof AppError) {
      return NextResponse.json({ error: e.message }, { status: e.statusCode });
    }
    throw e;
  }
}
