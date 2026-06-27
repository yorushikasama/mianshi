import { candidateQuestions, practiceFeedback } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/shiny-button";
import { ListRow } from "@/components/ui/list-row";
import { Panel } from "@/components/ui/panel";

const attempts = [
  { questionId: "frontend-degrade", score: 0, result: "回答错误", time: "今天 10:20", note: "降级策略选项判断失误" },
  { questionId: "performance-project", score: practiceFeedback.score, result: "已反馈", time: "昨天 21:14", note: "项目表达有进步，仍需补数据" },
  { questionId: "next-app-router", score: 82, result: "已掌握", time: "3 天前", note: "框架差异回答完整" }
];

export default function PracticeHistoryPage() {
  return (
    <main className="grid gap-[18px]">
      <Panel
        actions={<Button href="/practice" size="sm">返回练习</Button>}
        badge="练习历史"
        badgeVariant="hot"
        description="查看最近练过的题、反馈分和结果入口。"
        title="练习记录"
      >
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            ["练习次数", `${attempts.length} 次`],
            ["平均反馈", "79 分"],
            ["待复盘", "1 题"]
          ].map(([label, value]) => (
            <div className="rounded-2xl border border-[#17151f12] bg-white/70 p-4" key={label}>
              <span className="text-xs font-bold text-[#17151f73]">{label}</span>
              <strong className="mt-1 block text-2xl text-[#17151f]">{value}</strong>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-2xl border border-[#17151f12] bg-[#17151f] p-4 text-white">
          <span className="text-xs font-bold text-white/60">最近一次</span>
          <strong className="mt-1 block text-xl leading-snug">接口降级方案答错，建议今天复盘</strong>
          <span className="mt-2 block text-sm text-white/70">从历史页直接进入结果报告，看解析和错题回流状态。</span>
        </div>
      </Panel>

      <Panel title="最近练习">
        <div className="grid gap-3">
          {attempts.map((attempt) => {
            const question = candidateQuestions.find((item) => item.id === attempt.questionId);
            if (!question) return null;
            const scoreText = attempt.score ? `${attempt.score} 分` : "选择题";

            return (
              <article
                className="grid gap-3 rounded-2xl border border-[#17151f12] bg-white/70 p-4 transition hover:border-[#17151f29] hover:bg-white md:grid-cols-[92px_minmax(0,1fr)_auto] md:items-center"
                key={question.id}
              >
                <div className="grid h-16 w-20 place-items-center rounded-2xl bg-white text-center shadow-[0_6px_14px_rgba(23,21,31,0.06)]">
                  <strong className="text-xl text-[#17151f]">{scoreText}</strong>
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={attempt.result === "回答错误" ? "hot" : "ok"}>{attempt.result}</Badge>
                    <span className="text-sm font-bold text-[#17151f73]">{attempt.time}</span>
                  </div>
                  <strong className="mt-2 block text-[#17151f]">{question.title}</strong>
                  <span className="mt-1 block text-sm text-[#17151f73]">
                    {question.typeLabel} · {question.difficulty} · {attempt.note}
                  </span>
                </div>
                <Button href={`/practice/${question.id}/result`} size="sm" variant={attempt.result === "回答错误" ? "solid" : "default"}>
                  查看结果
                </Button>
              </article>
            );
          })}
        </div>
      </Panel>
    </main>
  );
}
