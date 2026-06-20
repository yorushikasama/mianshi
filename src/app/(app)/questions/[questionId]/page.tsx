import { notFound } from "next/navigation";
import { candidateQuestions } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/neon-button";
import { Panel } from "@/components/ui/panel";

export function generateStaticParams() {
  return candidateQuestions.map((question) => ({ questionId: question.id }));
}

export default async function QuestionDetailPage({
  params
}: {
  params: Promise<{ questionId: string }>;
}) {
  const { questionId } = await params;
  const question = candidateQuestions.find((item) => item.id === questionId);

  if (!question) notFound();

  return (
    <main className="page-stack">
      <Panel
        actions={<ButtonLink href={`/practice/${question.id}`} variant="solid">开始练习</ButtonLink>}
        badge="题目详情"
        badgeVariant="hot"
        description={`${question.typeLabel} · ${question.source} · ${question.difficulty}`}
        title={question.title}
      >
        <div className="tag-row">
          {question.tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
      </Panel>

      {question.type === "single_choice" ? (
        <>
          <Panel title="选项">
            <div className="choice-list">
              {(question.options ?? []).map((option) => (
                <label key={option.key} className="choice-option">
                  <input disabled name="question-option" type="radio" />
                  <span>{option.key}. {option.text}</span>
                </label>
              ))}
            </div>
          </Panel>

          <Panel title="正确答案">
            <p>{question.answerOption ?? ""}. {question.explanation ?? ""}</p>
          </Panel>
        </>
      ) : (
        <>
          <Panel title="参考答案">
            <p>{question.answer}</p>
          </Panel>

          <Panel title="口语版答案">
            <p>{question.spokenAnswer}</p>
          </Panel>
        </>
      )}
    </main>
  );
}
