import { NextResponse } from "next/server";
import { z } from "zod";
import { logEvent } from "@/core/logger";
import { checkRateLimit, getClientIp, rateLimitedResponse } from "@/lib/rate-limit";

const eventSchema = z.object({
  event: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9_:./-]+$/i, "Event name contains invalid characters"),
  properties: z.record(z.unknown()).optional(),
});

export async function POST(request: Request) {
  const rl = checkRateLimit(getClientIp(request), 30, 60_000);
  if (!rl.allowed) return rateLimitedResponse(rl.resetMs);

  try {
    const body = await request.json();
    const parsed = eventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid event payload" },
        { status: 400 }
      );
    }
    logEvent(parsed.data.event, parsed.data.properties);
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
