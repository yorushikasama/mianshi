import { GenerateWorkbench } from "./generate-workbench";
import { getCurrentInterviewTarget } from "@/lib/interview-targets";
import { requireUserSession } from "@/lib/server-session";

export default async function GeneratePage({
  searchParams
}: {
  searchParams: Promise<{ material?: string }>;
}) {
  const [{ material }, session] = await Promise.all([searchParams, requireUserSession()]);
  const interviewTarget = await getCurrentInterviewTarget(session.user.id);

  return <GenerateWorkbench interviewTarget={interviewTarget} materialId={material} />;
}
