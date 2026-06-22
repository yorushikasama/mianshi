import { notFound } from "next/navigation";
import { candidateQuestions, documents } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { ListRow } from "@/components/ui/list-row";
import { Button } from "@/components/ui/shiny-button";
import { Panel } from "@/components/ui/panel";
import { QuestionCard } from "@/components/ui/question-card";

export function generateStaticParams() {
  return documents.map((material) => ({ materialId: material.id }));
}

export default async function MaterialDetailPage({
  params
}: {
  params: Promise<{ materialId: string }>;
}) {
  const { materialId } = await params;
  const material = documents.find((item) => item.id === materialId);

  if (!material) notFound();

  const relatedQuestions = candidateQuestions.filter((question) =>
    material.relatedQuestionIds.includes(question.id)
  );

  return (
    <main className="grid gap-[18px]">
      <Panel
        actions={<Button href={`/generate?material=${material.id}`} variant="solid">生成候选题</Button>}
        badge="资料解析摘要"
        badgeVariant="hot"
        description={`${material.type} · ${material.status}`}
        title={material.name}
      >
        <p>{material.summary}</p>
      </Panel>

      <Panel title="解析结果">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3.5">
          <QuestionCard difficulty={material.knowledgePoints.join("、")} title="知识点" />
          <QuestionCard difficulty={material.projectPoints.join("、")} title="项目点" />
          <QuestionCard difficulty={material.generationDirections.join("、")} title="可生成题目方向" />
        </div>
      </Panel>

      <Panel title="关联题目">
        <div className="grid gap-3.5">
          {relatedQuestions.map((question) => (
            <ListRow
              action={<Badge>{question.difficulty}</Badge>}
              href={`/questions/${question.id}`}
              key={question.id}
              meta={question.source}
              title={question.title}
            />
          ))}
        </div>
      </Panel>
    </main>
  );
}
