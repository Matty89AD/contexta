import { notFound } from "next/navigation";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { getArtifactBySlug } from "@/repositories/artifacts";
import { getChallengeById } from "@/repositories/challenges";
import { ArtifactDetailClient } from "./ArtifactDetailClient";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ cid?: string }>;
}

export default async function ArtifactDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { cid } = await searchParams;

  const supabase = getServiceRoleClient();
  const artifact = await getArtifactBySlug(supabase, slug);
  if (!artifact) notFound();

  let challengeSummary: string | undefined;
  let challengeDomains: string[] | undefined;

  if (cid) {
    try {
      const challenge = await getChallengeById(supabase, cid);
      if (challenge) {
        challengeSummary = challenge.summary ?? undefined;
        challengeDomains = challenge.domains;
      }
    } catch {
      // Challenge fetch failure is non-fatal — pro-tip falls back to generic
    }
  }

  return (
    <ArtifactDetailClient
      artifact={artifact}
      challengeSummary={challengeSummary}
      challengeDomains={challengeDomains}
    />
  );
}
