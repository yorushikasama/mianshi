import { candidateQuestions } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { ListRow } from "@/components/ui/list-row";
import { Panel } from "@/components/ui/panel";

export default function PracticePage() {
  return (
    <main className="page-stack">
      <Panel
        badge="按题练习"
        badgeVariant="hot"
        description="选择一道题进入专属练习页，问答题写回答，选择题选 A/B/C/D。"
        title="待练题目"
      />

      <Panel title="练习队列">
        <div className="list">
          {candidateQuestions.map((question) => (
            <ListRow
              action={<Badge>{question.typeLabel}</Badge>}
              href={`/practice/${question.id}`}
              key={question.id}
              meta={`${question.source} · ${question.difficulty}`}
              title={question.title}
            />
          ))}
        </div>
      </Panel>
    </main>
  );
}
