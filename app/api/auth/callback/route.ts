import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/journey";
  const cid = searchParams.get("cid");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=auth`);
    }

    // Auto-create a bare profile row for OAuth users (non-fatal if it exists already).
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .upsert({ id: user.id }, { onConflict: "id", ignoreDuplicates: true });
    }
  }

  // Build the redirect URL, threading cid through for challenge claiming on the journey page.
  let redirectPath = next;
  if (cid) {
    const sep = next.includes("?") ? "&" : "?";
    redirectPath = `${next}${sep}cid=${encodeURIComponent(cid)}`;
  }

  return NextResponse.redirect(`${origin}${redirectPath}`);
}
