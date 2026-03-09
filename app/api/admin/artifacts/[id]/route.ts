import { NextResponse } from "next/server";
import { createClient, getServiceRoleClient } from "@/lib/supabase/server";
import {
  getArtifactById,
  updateArtifact,
  deleteArtifact,
} from "@/repositories/artifacts";
import { generateNewsProposal } from "@/services/news-proposal";
import { createOpenRouterProvider } from "@/core/ai/openrouter-provider";
import { UnauthorizedError, ForbiddenError, NotFoundError, AppError } from "@/core/errors";

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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const serviceClient = getServiceRoleClient();
    const artifact = await getArtifactById(serviceClient, id);
    if (!artifact) throw new NotFoundError(`Artifact ${id} not found`);
    return NextResponse.json(artifact);
  } catch (e) {
    if (e instanceof AppError) {
      return NextResponse.json({ error: e.message }, { status: e.statusCode });
    }
    throw e;
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const serviceClient = getServiceRoleClient();

    // Get current artifact to detect status transition
    const current = await getArtifactById(serviceClient, id);
    if (!current) throw new NotFoundError(`Artifact ${id} not found`);

    const updated = await updateArtifact(serviceClient, id, body);

    // Trigger news proposal whenever status transitions to active (per spec Q39: every activation)
    if (body.status === "active") {
      try {
        const ai = createOpenRouterProvider();
        await generateNewsProposal(
          {
            type: "artifact",
            id,
            title: updated.title,
            domains: updated.domains,
            use_case: updated.use_case,
            description: (updated.detail as Record<string, unknown> | null)?.description as string | undefined,
          },
          ai,
          serviceClient
        );
      } catch (e) {
        // Non-fatal
        console.error("[news-proposal] failed for artifact", id, e);
      }
    }

    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof AppError) {
      return NextResponse.json({ error: e.message }, { status: e.statusCode });
    }
    throw e;
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const serviceClient = getServiceRoleClient();
    await deleteArtifact(serviceClient, id);
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof AppError) {
      return NextResponse.json({ error: e.message }, { status: e.statusCode });
    }
    if (e instanceof Error && e.message.includes("Cannot delete")) {
      return NextResponse.json({ error: e.message }, { status: 409 });
    }
    throw e;
  }
}
