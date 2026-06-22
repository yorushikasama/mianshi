import { candidateQuestions, documents, todayTasks, weakAreas } from "@/lib/mock-data";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ListRow } from "@/components/ui/list-row";
import { Button } from "@/components/ui/shiny-button";
import { Panel } from "@/components/ui/panel";
import { QuestionCard } from "@/components/ui/question-card";
import { PracticeTrendChart, WeakAreaBarChart } from "@/components/dashboard/dashboard-charts";

const reviewQueue = [
  { title: "Next.js App Router", meta: "问答题 · 10 分钟", href: "/practice/next-app-router", state: "复习到期" },
  { title: "接口降级方案", meta: "选择题 · 3 分钟", href: "/practice/frontend-degrade", state: "待巩固" }
];

const recentPractice = [
  { title: "接口超时降级方案", meta: "选择题 · 已加入复习", href: "/practice/frontend-degrade/result", state: "已完成" },
  { title: "首屏性能问题定位", meta: "问答题 · 待复述", href: "/practice/performance-project", state: "下次复习" }
];

const weeklyPractice = [
  { day: "周二", count: 2, score: 61 },
  { day: "周三", count: 1, score: 64 },
  { day: "周四", count: 3, score: 68 },
  { day: "周五", count: 2, score: 66 },
  { day: "周六", count: 4, score: 72 },
  { day: "周日", count: 2, score: 74 },
  { day: "今天", count: 3, score: 78 }
];

const pipeline = [
  { label: "资料解析", value: documents.filter((item) => item.status === "已解析").length, href: "/materials" },
  { label: "候选确认", value: candidateQuestions.length, href: "/generate" },
  { label: "题库入库", value: candidateQuestions.length, href: "/questions" },
  { label: "今日待练", value: todayTasks.length, href: "/practice" }
];

export default function DashboardPage() {
  const focusTask = todayTasks[1] ?? todayTasks[0];
  const dueReviews = reviewQueue.filter((item) => item.state === "复习到期").length;
  const averageWeakScore = Math.round(
    weakAreas.reduce((total, area) => total + area.score, 0) / Math.max(weakAreas.length, 1)
  );
  const kpis = [
    { label: "题库", value: candidateQuestions.length, hint: "可练题" },
    { label: "今日待练", value: todayTasks.length, hint: "建议任务" },
    { label: "复习到期", value: dueReviews, hint: "需要回看" },
    { label: "薄弱点", value: weakAreas.length, hint: `均分 ${averageWeakScore}` },
    { label: "资料", value: documents.length, hint: "已导入" },
    { label: "AI 接入", value: "未连", hint: "BYOK" }
  ];

  return (
    <main className="grid gap-[clamp(18px,2.5vw,28px)]">
      <section className="grid gap-4 rounded-[22px] border border-black/10 bg-white/75 p-5 shadow-[0_18px_60px_rgba(23,21,31,0.08)] backdrop-blur-lg md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <Badge variant="hot">Dashboard</Badge>
            <h1 className="mt-3 text-2xl font-black leading-tight text-[#17151f] md:text-3xl">
              今日面试复习控制台
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#17151f99]">
              先处理项目追问和复习到期，再把候选题入库，避免资料和练习断开。
            </p>
          </div>
          <Button href="/practice" variant="solid">进入练习</Button>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(135px,1fr))] gap-3">
          {kpis.map((item) => (
            <div className="rounded-2xl border border-[#17151f12] bg-white/75 p-4" key={item.label}>
              <span className="text-xs font-bold text-[#17151f73]">{item.label}</span>
              <strong className="mt-1 block text-2xl text-[#17151f]">{item.value}</strong>
              <small className="mt-1 block text-[#17151f73]">{item.hint}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-[clamp(18px,2.5vw,28px)] xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <Panel
          actions={<Button href={focusTask.href} variant="solid">开始今日训练</Button>}
          badge="主行动"
          badgeVariant="hot"
          title={focusTask.title}
        >
          <div className="grid gap-4">
            <p className="m-0 max-w-3xl text-[0.95rem] leading-relaxed text-[#17151f99]">
              优先处理这个任务：它关联当前薄弱点和项目表达，练完后再进入复习队列。
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-pink-200 bg-pink-50 p-4">
                <span className="text-xs font-bold text-pink-700/75">任务状态</span>
                <strong className="mt-1 block text-xl text-pink-800">{focusTask.state}</strong>
              </div>
              <div className="rounded-2xl border border-[#17151f14] bg-white/65 p-4">
                <span className="text-xs font-bold text-[#17151f73]">任务类型</span>
                <strong className="mt-1 block text-xl text-[#17151f]">{focusTask.tag}</strong>
              </div>
              <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4">
                <span className="text-xs font-bold text-teal-700/75">预计耗时</span>
                <strong className="mt-1 block text-xl text-teal-800">15 分钟</strong>
              </div>
            </div>
          </div>
        </Panel>

        <Panel className="grid content-start gap-4" title="近 7 天练习趋势">
          <div className="rounded-2xl border border-[#17151f12] bg-white/70 p-4">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <strong className="block text-2xl text-[#17151f]">78</strong>
                <span className="text-sm text-[#17151f73]">今日平均反馈分</span>
              </div>
              <Badge variant="ok">连续 4 天</Badge>
            </div>
            <PracticeTrendChart data={weeklyPractice} />
          </div>
        </Panel>
      </section>

      <section className="grid gap-[clamp(18px,2.5vw,28px)] xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.78fr)]">
        <Panel className="grid content-start gap-4" title="薄弱点分布">
          <Link className="block rounded-2xl border border-[#17151f12] bg-white/70 p-4 text-inherit no-underline hover:border-black/20 hover:bg-white/85" href="/questions">
            <WeakAreaBarChart data={weakAreas} />
            <span className="mt-2 block text-sm text-[#17151f73]">点击查看相关题目和错题。</span>
          </Link>
        </Panel>

        <Panel className="grid content-start gap-4" title="复习压力">
          <div className="grid gap-3.5">
            {reviewQueue.map((item) => (
              <ListRow
                action={<Badge variant={item.state === "复习到期" ? "hot" : "default"}>{item.state}</Badge>}
                href={item.href}
                key={item.title}
                meta={item.meta}
                title={item.title}
              />
            ))}
          </div>
        </Panel>
      </section>

      <Panel className="grid content-start gap-4" title="最近练习" wide>
        <div className="grid gap-3.5 md:grid-cols-2">
          {recentPractice.map((item) => (
            <ListRow
              action={<Badge variant={item.state === "已完成" ? "ok" : "default"}>{item.state}</Badge>}
              href={item.href}
              key={item.title}
              meta={item.meta}
              title={item.title}
            />
          ))}
        </div>
      </Panel>

      <section className="grid gap-[clamp(18px,2.5vw,28px)]">
        <Panel title="出题链路" wide>
          <div className="grid gap-3.5 md:grid-cols-4">
            {pipeline.map((item, index) => (
              <Link
                className="grid gap-3 rounded-[18px] border border-[#17151f14] bg-white/70 p-4 text-inherit no-underline transition hover:-translate-y-px hover:border-[#17151f29] hover:bg-white/90"
                href={item.href}
                key={item.label}
              >
                <span className="inline-grid h-8 w-8 place-items-center rounded-full border border-[#17151f14] bg-white text-sm font-black text-[#17151f]">
                  {index + 1}
                </span>
                <span className="text-sm font-bold text-[#17151f73]">{item.label}</span>
                <strong className="text-3xl leading-none text-[#17151f]">{item.value}</strong>
              </Link>
            ))}
          </div>
        </Panel>

        <Panel
          actions={<Button href="/questions">查看题库</Button>}
          title="最近新增候选题"
          wide
        >
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3.5">
            {candidateQuestions.slice(0, 3).map((question) => (
              <QuestionCard
                action={<Button href={`/questions/${question.id}`} size="sm">查看详情</Button>}
                difficulty={question.difficulty}
                key={question.title}
                source={question.typeLabel}
                title={question.title}
              />
            ))}
          </div>
        </Panel>
      </section>
    </main>
  );
}
