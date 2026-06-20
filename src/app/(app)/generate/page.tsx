import { GenerateWorkbench } from "./generate-workbench";

export default async function GeneratePage({
  searchParams
}: {
  searchParams: Promise<{ material?: string }>;
}) {
  const { material } = await searchParams;

  return <GenerateWorkbench materialId={material} />;
}
