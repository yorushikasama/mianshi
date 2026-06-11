import { PracticeWorkbench } from "@/components/practice-workbench";

export default async function PracticeQuestionPage({
  params,
}: {
  params: Promise<{ questionId: string }>;
}) {
  const { questionId } = await params;

  return <PracticeWorkbench questionId={questionId} />;
}
