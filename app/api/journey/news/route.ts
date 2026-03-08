import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { getPublishedNews } from "@/repositories/admin";

/** Public endpoint — returns published news posts for the Journey NewsCard. */
export async function GET() {
  try {
    const serviceClient = getServiceRoleClient();
    const posts = await getPublishedNews(serviceClient);
    return NextResponse.json(posts);
  } catch (e) {
    // Non-fatal: return empty array on error so NewsCard degrades gracefully
    console.error("Failed to fetch published news", e);
    return NextResponse.json([]);
  }
}
