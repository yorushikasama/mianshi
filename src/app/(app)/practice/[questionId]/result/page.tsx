import { notFound } from "next/navigation";
import { candidateQuestions, practiceFeedback } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/neon-button";
import { ButtonLink } from "@/components/ui/neon-button";
import { Panel } from "@/components/ui/panel";
import { Toolbar } from "@/components/ui/toolbar";

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

  return (
    <main className="page-grid">
      <Panel
        actions={
          <Toolbar>
            <ButtonLink href={`/practice/${question.id}`} variant="solid">再练一次</ButtonLink>
            <ButtonLink href={`/practice/${nextQuestion.id}`}>下一题</ButtonLink>
            <ButtonLink href="/questions">回题库</ButtonLink>
          </Toolbar>
        }
        badge="练习结果"
        badgeVariant="hot"
        description={`${question.typeLabel} · ${question.title}`}
        title={question.type === "single_choice" ? "答案解析" : `${practiceFeedback.score} 分`}
      >
        {question.type === "single_choice" ? (
          <div className="list">
            <p>你的选择：{question.mockSelectedOption ?? "C"}</p>
            <p>正确答案：{question.answerOption ?? ""}</p>
            <p>{question.explanation ?? ""}</p>
          </div>
        ) : (
          <p>{practiceFeedback.suggestion}</p>
        )}
      </Panel>

      {question.type === "single_choice" ? null : (
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
        <Toolbar>
          <Button>标记掌握</Button>
          <Button>加入错题</Button>
          <Button>下次复习</Button>
        </Toolbar>
      </Panel>
    </main>
  );
}
