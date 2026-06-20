import { notFound } from "next/navigation";
import { candidateQuestions, documents } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { ListRow } from "@/components/ui/list-row";
import { ButtonLink } from "@/components/ui/neon-button";
import { Panel } from "@/components/ui/panel";

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
    <main className="page-stack">
      <Panel
        actions={<ButtonLink href={`/generate?material=${material.id}`} variant="solid">生成候选题</ButtonLink>}
        badge="资料解析摘要"
        badgeVariant="hot"
        description={`${material.type} · ${material.status}`}
        title={material.name}
      >
        <p>{material.summary}</p>
      </Panel>

      <Panel title="解析结果">
        <div className="question-grid">
          <div className="question-card">
            <h3>知识点</h3>
            <p>{material.knowledgePoints.join("、")}</p>
          </div>
          <div className="question-card">
            <h3>项目点</h3>
            <p>{material.projectPoints.join("、")}</p>
          </div>
          <div className="question-card">
            <h3>可生成题目方向</h3>
            <p>{material.generationDirections.join("、")}</p>
          </div>
        </div>
      </Panel>

      <Panel title="关联题目">
        <div className="list">
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
