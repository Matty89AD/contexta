import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { getContentById } from "@/repositories/content";
import { NotFoundError } from "@/core/errors";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getServiceRoleClient();
    const content = await getContentById(supabase, id);
    if (!content) throw new NotFoundError(`Content not found: ${id}`);

    const wordCount = content.transcript_raw
      ? content.transcript_raw.trim().split(/\s+/).length
      : null;

    return NextResponse.json({
      id: content.id,
      title: content.title,
      author: content.author,
      source_type: content.source_type,
      url: content.url,
      publication_date: content.publication_date,
      domains: content.domains,
      topics: content.topics,
      keywords: content.keywords,
      summary: content.summary,
      extraction_confidence: content.extraction_confidence,
      word_count: wordCount,
    });
  } catch (e) {
    if (e instanceof NotFoundError) {
      return NextResponse.json({ error: e.message }, { status: 404 });
    }
    throw e;
  }
}
