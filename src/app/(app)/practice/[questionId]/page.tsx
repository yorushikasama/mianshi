import { notFound } from "next/navigation";
import { candidateQuestions } from "@/lib/mock-data";
import { PracticeRunner } from "../practice-runner";

export function generateStaticParams() {
  return candidateQuestions.map((question) => ({ questionId: question.id }));
}

export default async function QuestionPracticePage({
  params
}: {
  params: Promise<{ questionId: string }>;
}) {
  const { questionId } = await params;
  const question = candidateQuestions.find((item) => item.id === questionId);

  if (!question) notFound();

  return <PracticeRunner question={question} />;
}
