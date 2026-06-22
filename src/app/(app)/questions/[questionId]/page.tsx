import { notFound } from "next/navigation";
import { candidateQuestions } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/shiny-button";
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
    <main className="grid gap-[18px]">
      <Panel
        actions={<Button href={`/practice/${question.id}`} variant="solid">开始练习</Button>}
        badge="题目详情"
        badgeVariant="hot"
        description="练习前先看题干和上下文，答案默认折叠，保持主动回忆。"
        title={question.title}
      />

      <section className="grid gap-[18px] xl:grid-cols-[minmax(0,1fr)_340px]">
        <Panel title="题目工作台">
          <div className="grid gap-4">
            <div className="flex flex-wrap gap-2">
              <Badge>{question.typeLabel}</Badge>
              <Badge>{question.source}</Badge>
              <Badge>{question.difficulty}</Badge>
              {question.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
            <div className="rounded-2xl border border-[#17151f12] bg-white/65 p-4">
              <span className="text-xs font-bold text-[#17151f73]">题干</span>
              <p className="mb-0 mt-2 text-lg font-bold leading-relaxed text-[#17151f]">{question.title}</p>
            </div>
          </div>
        </Panel>

        <Panel title="复习状态">
          <div className="grid gap-3 text-sm text-[#17151f99]">
            <div className="rounded-2xl border border-[#17151f12] bg-white/65 p-4">
              <strong className="block text-[#17151f]">最近练习</strong>
              <span>{question.type === "single_choice" ? "昨天答错 1 次" : "3 天前提交回答"}</span>
            </div>
            <div className="rounded-2xl border border-[#17151f12] bg-white/65 p-4">
              <strong className="block text-[#17151f]">下次复习</strong>
              <span>{question.difficulty === "偏难" ? "今天建议复习" : "明天回看"}</span>
            </div>
            <Button href={`/practice/${question.id}`} variant="solid">开始练习</Button>
          </div>
        </Panel>
      </section>

      {question.type === "single_choice" ? (
        <>
          <Panel title="选项">
            <div className="grid gap-2.5">
              {(question.options ?? []).map((option) => (
                <div key={option.key} className="rounded-2xl border border-[#17151f14] bg-white/50 px-3.5 py-3 leading-[1.55] text-[#17151fc7]">
                  {option.key}. {option.text}
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="正确答案">
            <details className="rounded-[18px] border border-[#17151f14] bg-white/50 px-4 py-3.5">
              <summary className="cursor-pointer font-black">展开正确答案和解析</summary>
              <p className="mb-0">{question.answerOption ?? ""}. {question.explanation ?? ""}</p>
            </details>
          </Panel>
        </>
      ) : (
        <>
          <Panel title="参考答案">
            <details className="rounded-[18px] border border-[#17151f14] bg-white/50 px-4 py-3.5">
              <summary className="cursor-pointer font-black">展开参考答案</summary>
              <p className="mb-0">{question.answer}</p>
            </details>
          </Panel>

          <Panel title="口语版答案">
            <details className="rounded-[18px] border border-[#17151f14] bg-white/50 px-4 py-3.5">
              <summary className="cursor-pointer font-black">展开口语版答案</summary>
              <p className="mb-0">{question.spokenAnswer}</p>
            </details>
          </Panel>
        </>
      )}
    </main>
  );
}
