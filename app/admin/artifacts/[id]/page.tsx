import ArtifactEditor from "@/components/admin/ArtifactEditor";

export default async function AdminArtifactEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ArtifactEditor artifactId={id} />;
}
