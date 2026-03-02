import { NextResponse } from "next/server";
import { logEvent } from "@/core/logger";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const event = typeof body?.event === "string" ? body.event : null;
    if (!event) {
      return NextResponse.json(
        { error: "Missing or invalid event name" },
        { status: 400 }
      );
    }
    const properties =
      body?.properties && typeof body.properties === "object"
        ? (body.properties as Record<string, unknown>)
        : undefined;
    logEvent(event, properties);
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
