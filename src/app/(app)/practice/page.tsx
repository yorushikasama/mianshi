import { candidateQuestions } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { ListRow } from "@/components/ui/list-row";
import { Button } from "@/components/ui/shiny-button";
import { Panel } from "@/components/ui/panel";

export default function PracticePage() {
  const dueQuestions = candidateQuestions.filter((question) => question.id === "next-app-router");
  const estimate = (type: string) => type === "single_choice" ? "3 分钟" : type === "behavior_star" ? "8 分钟" : "10 分钟";

  return (
    <main className="grid gap-[18px]">
      <Panel
        actions={
          <>
            <Button href="/practice/review" size="sm" variant="solid">复习计划</Button>
            <Button href="/practice/history" size="sm">练习历史</Button>
          </>
        }
        badge="按题练习"
        badgeVariant="hot"
        description="推荐先练项目追问和复习到期题，选择题约 3 分钟，问答题约 10 分钟。"
        title="今日练习计划"
      >
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            ["推荐题", "3 题"],
            ["预计耗时", "25 分钟"],
            ["复习到期", `${dueQuestions.length} 题`]
          ].map(([label, value]) => (
            <div className="rounded-2xl border border-[#17151f12] bg-white/70 p-4" key={label}>
              <span className="text-xs font-bold text-[#17151f73]">{label}</span>
              <strong className="mt-1 block text-2xl text-[#17151f]">{value}</strong>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="今日推荐">
        <div className="grid gap-3.5">
          {candidateQuestions.map((question) => (
            <ListRow
              action={<Badge variant="ok">开始练习</Badge>}
              href={`/practice/${question.id}`}
              key={question.id}
              meta={`${question.typeLabel} · ${question.difficulty} · ${question.source} · ${estimate(question.type)}`}
              title={question.title}
            />
          ))}
        </div>
      </Panel>

      <div className="grid gap-[18px] lg:grid-cols-2">
        <Panel title="复习到期">
          <div className="grid gap-3.5">
            {dueQuestions.map((question) => (
              <ListRow
                action={<Badge variant="hot">到期</Badge>}
                href={`/practice/${question.id}`}
                key={question.id}
                meta={`${question.typeLabel} · ${question.difficulty}`}
                title={question.title}
              />
            ))}
          </div>
        </Panel>

        <Panel title="全部题目">
          <div className="grid gap-3.5">
            {candidateQuestions.map((question) => (
              <ListRow
                action={<Badge>{question.typeLabel}</Badge>}
                href={`/questions/${question.id}`}
                key={question.id}
                meta={`${question.source} · ${question.difficulty}`}
                title={question.title}
              />
            ))}
          </div>
        </Panel>
      </div>
    </main>
  );
}
