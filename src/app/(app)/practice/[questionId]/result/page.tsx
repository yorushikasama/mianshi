import { notFound } from "next/navigation";
import { candidateQuestions, practiceFeedback } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/shiny-button";
import { Panel } from "@/components/ui/panel";
import { Toolbar } from "@/components/ui/toolbar";
import { ReviewActions } from "./review-actions";

export function generateStaticParams() {
  return candidateQuestions.map((question) => ({ questionId: question.id }));
}

export default async function QuestionPracticeResultPage({
  params
}: {
  params: Promise<{ questionId: string }>;
}) {
  const { questionId } = await params;
  const question = candidateQuestions.find((item) => item.id === questionId);

  if (!question) notFound();

  const nextQuestion = candidateQuestions[(candidateQuestions.findIndex((item) => item.id === question.id) + 1) % candidateQuestions.length];
  const isChoice = question.type === "single_choice";
  const isCorrect = question.mockSelectedOption === question.answerOption;

  return (
    <main className="grid grid-cols-[minmax(0,1.04fr)_minmax(280px,0.42fr)] gap-[clamp(18px,2.5vw,28px)] max-[860px]:grid-cols-1">
      <Panel
        actions={
          <Toolbar>
            <Button href={`/practice/${question.id}`} variant="solid">再练一次</Button>
            <Button href={`/practice/${nextQuestion.id}`}>下一题</Button>
            <Button href="/questions">回题库</Button>
          </Toolbar>
        }
        badge="练习结果"
        badgeVariant="hot"
        description={`${question.typeLabel} · ${question.title}`}
        title={isChoice ? (isCorrect ? "回答正确" : "回答错误") : `${practiceFeedback.score} 分`}
      >
        {isChoice ? (
          <div className="grid gap-3.5 md:grid-cols-2">
            <div className="rounded-2xl border border-[#17151f12] bg-white/65 p-4">
              <span className="text-xs font-bold text-[#17151f73]">你的选择</span>
              <strong className="mt-1 block text-2xl text-[#17151f]">{question.mockSelectedOption ?? "C"}</strong>
            </div>
            <div className="rounded-2xl border border-[#17151f12] bg-white/65 p-4">
              <span className="text-xs font-bold text-[#17151f73]">正确答案</span>
              <strong className="mt-1 block text-2xl text-[#17151f]">{question.answerOption ?? ""}</strong>
            </div>
          </div>
        ) : (
          <p className="text-[#17151f99]">{practiceFeedback.suggestion}</p>
        )}
      </Panel>

      {isChoice ? (
        <Panel title="答案解析">
          <p className="m-0 leading-relaxed text-[#17151f99]">{question.explanation ?? ""}</p>
        </Panel>
      ) : (
        <>
          <Panel title="遗漏点">
            <ul>
              {practiceFeedback.missing.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Panel>

          <Panel title="追问风险">
            <ul>
              {practiceFeedback.followups.map((item) => (
                <li key={item}>
                  <Badge>{item}</Badge>
                </li>
              ))}
            </ul>
          </Panel>
        </>
      )}

      <Panel title="复习回流">
        <ReviewActions />
      </Panel>
    </main>
  );
}
