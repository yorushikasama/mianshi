"use client";

import { useEffect, useMemo, useState } from "react";
import type { AiJob, AiJobUsageSummary, ReviewMistakes, ReviewOverview } from "@mianshi/shared";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  CalendarCheck,
  Flame,
  ListChecks,
  LogIn,
  Target,
  TimerReset,
} from "lucide-react";
import { useAuth } from "./auth-provider";
import { ApiError, fetchAiJobUsage, fetchAiJobs, fetchReviewMistakes, fetchReviewOverview } from "@/lib/api";
import { formatAiJobFailureSummary, formatAiJobUsageSummary } from "@/lib/ai-job-usage-ui";

const fallbackTasks = [
  {
    title: "JVM GC Roots 复述",
    detail: "用 2 分钟说清楚可达性分析",
    level: "medium",
    questionId: "q_jvm_gc_roots",
  },
  {
    title: "线程池拒绝策略场景题",
    detail: "补充线上削峰、降级和拒绝策略取舍",
    level: "medium",
    questionId: "q_thread_pool_rejection",
  },
  {
    title: "项目性能优化追问",
    detail: "按定位、方案、效果数据、权衡取舍组织回答",
    level: "hard",
    questionId: "q_project_latency_optimization",
  },
];

interface DashboardOverviewProps {
  categoryCount: number;
  seedQuestionCount: number;
}

export function DashboardOverview({ categoryCount, seedQuestionCount }: DashboardOverviewProps) {
  const { status, user } = useAuth();
  const [overview, setOverview] = useState<ReviewOverview | null>(null);
  const [mistakes, setMistakes] = useState<ReviewMistakes | null>(null);
  const [usageSummary, setUsageSummary] = useState<AiJobUsageSummary | null>(null);
  const [failedJobs, setFailedJobs] = useState<AiJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadOverview() {
      if (status !== "authenticated") {
        setOverview(null);
        setMistakes(null);
        setUsageSummary(null);
        setFailedJobs([]);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [loadedOverview, loadedMistakes, loadedUsageSummary, loadedFailedJobs] = await Promise.all([
          fetchReviewOverview({ dueLimit: 6, recentLimit: 5 }),
          fetchReviewMistakes({ limit: 4, maxScore: 70 }),
          fetchAiJobUsage(),
          fetchAiJobs({ status: "failed", pageSize: 3 }),
        ]);
        if (active) {
          setOverview(loadedOverview);
          setMistakes(loadedMistakes);
          setUsageSummary(loadedUsageSummary);
          setFailedJobs(loadedFailedJobs.items);
        }
      } catch (loadError) {
        if (active) {
          setOverview(null);
          setMistakes(null);
          setUsageSummary(null);
          setFailedJobs([]);
          setError(toErrorMessage(loadError));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (status !== "loading") {
      void loadOverview();
    }

    return () => {
      active = false;
    };
  }, [status]);

  const stats = useMemo(
    () => [
      { label: "Java 知识节点", value: categoryCount.toString(), icon: BarChart3 },
      { label: "首批高频题", value: seedQuestionCount.toString(), icon: ListChecks },
      {
        label: "今日待复习",
        value: overview ? String(overview.dueTodayCount + overview.overdueCount) : fallbackTasks.length.toString(),
        icon: CalendarCheck,
      },
      {
        label: "薄弱分类",
        value: overview ? overview.weakCategories.length.toString() : "5",
        icon: Flame,
      },
    ],
    [categoryCount, overview, seedQuestionCount],
  );

  const primaryRisk = overview?.weakCategories[0];
  const dueItems = overview?.dueItems ?? [];
  const formattedUsage = usageSummary ? formatAiJobUsageSummary(usageSummary) : null;

  return (
    <>
      <section className="stats-row" aria-label="学习概览">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article className="metric" key={stat.label}>
              <Icon size={19} />
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </article>
          );
        })}
      </section>

      <section className="dashboard-panel" aria-labelledby="dashboard-title">
        <div className="dashboard-heading">
          <div>
            <p className="eyebrow">学习闭环</p>
            <h2 id="dashboard-title">今日复习工作台</h2>
          </div>
          {status === "authenticated" && user ? <span className="session-badge">{user.displayName ?? user.email}</span> : null}
        </div>

        {status === "unauthenticated" ? (
          <div className="dashboard-callout">
            <LogIn size={20} />
            <div>
              <strong>登录后启用个人复习计划</strong>
              <span>系统会按你的练习记录展示待复习、逾期题和薄弱分类。</span>
            </div>
            <a href="/auth">登录 / 注册</a>
          </div>
        ) : null}

        {error ? (
          <div className="dashboard-error" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="dashboard-grid">
          <article className="focus-panel">
            <div className="panel-heading compact">
              <Target size={18} />
              <span>今日面试风险</span>
            </div>
            {loading ? (
              <DashboardSkeleton />
            ) : primaryRisk ? (
              <>
                <strong>{primaryRisk.categoryName} 回答稳定性偏低</strong>
                <p>
                  当前平均分 {primaryRisk.averageScore}，最低分 {primaryRisk.lowestScore}。建议先补齐这个分类下遗漏的关键点，再进入下一轮模拟。
                </p>
                <div className="risk-meter" aria-label={`薄弱风险 ${100 - primaryRisk.averageScore}%`}>
                  <span style={{ width: `${Math.max(12, 100 - primaryRisk.averageScore)}%` }} />
                </div>
                <dl className="risk-facts">
                  <div>
                    <dt>练习次数</dt>
                    <dd>{primaryRisk.attemptCount}</dd>
                  </div>
                  <div>
                    <dt>优先级</dt>
                    <dd>{primaryRisk.lowestScore < 60 ? "高" : "中"}</dd>
                  </div>
                </dl>
              </>
            ) : (
              <>
                <strong>{overview ? "暂无明显薄弱分类" : "项目追问表达不够闭环"}</strong>
                <p>
                  {overview
                    ? "继续完成今日复习，系统会在记录增加后自动聚合更稳定的薄弱点。"
                    : "建议优先练习“定位问题、技术方案、效果数据、权衡取舍”的四段式回答。"}
                </p>
                <div className="risk-meter" aria-label="风险等级 72%">
                  <span style={{ width: "72%" }} />
                </div>
              </>
            )}
          </article>

          <article className="review-queue" id="plan">
            <div className="section-title">
              <TimerReset size={20} />
              <h2>今日复习计划</h2>
            </div>
            {loading ? (
              <div className="queue-skeleton">
                <DashboardSkeleton />
                <DashboardSkeleton />
              </div>
            ) : dueItems.length > 0 ? (
              <div className="task-list">
                {dueItems.map((item) => (
                  <article className="task-item" key={item.questionId}>
                    <div>
                      <span className={`difficulty ${item.difficulty}`}>{item.status === "overdue" ? "逾期" : "今日"}</span>
                      <h3>{item.title}</h3>
                      <p>
                        {item.categoryName} · 最近 {item.lastScore ?? "--"} 分 · 已练 {item.attemptCount} 次
                      </p>
                    </div>
                    <a className="task-button" href={`/practice/${item.questionId}`} aria-label={`练习 ${item.title}`}>
                      开始
                    </a>
                  </article>
                ))}
              </div>
            ) : overview ? (
              <div className="empty-state">
                <strong>今天没有到期复习</strong>
                <span>可以从高频题里主动加练，保持面试表达的热度。</span>
                <a href="/practice/q_project_latency_optimization">
                  加练项目追问
                  <ArrowRight size={16} />
                </a>
              </div>
            ) : (
              <div className="task-list">
                {fallbackTasks.map((task) => (
                  <article className="task-item" key={task.title}>
                    <div>
                      <span className={`difficulty ${task.level}`}>{task.level}</span>
                      <h3>{task.title}</h3>
                      <p>{task.detail}</p>
                    </div>
                    <a className="task-button" href={`/practice/${task.questionId}`} aria-label={`练习 ${task.title}`}>
                      开始
                    </a>
                  </article>
                ))}
              </div>
            )}
          </article>

          <article className="recent-panel">
            <div className="section-title">
              <AlertCircle size={20} />
              <h2>错题优先</h2>
            </div>
            {mistakes?.items.length ? (
              <ol className="recent-list">
                {mistakes.items.map((item) => (
                  <li key={item.questionId}>
                    <div>
                      <strong>{item.title}</strong>
                      <span>
                        {item.categoryName} · 最低 {item.lowestScore} · 最近 {item.latestScore}
                      </span>
                    </div>
                    <a className="score-pill" href={`/practice/${item.questionId}`}>
                      重练
                    </a>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="empty-state compact-empty">
                <strong>{status === "authenticated" ? "暂时没有低分错题" : "登录后显示错题"}</strong>
                <span>低于 70 分的题会进入这里，方便先补最容易丢分的部分。</span>
              </div>
            )}
          </article>

          <article className="recent-panel">
            <div className="section-title">
              <BarChart3 size={20} />
              <h2>最近练习</h2>
            </div>
            {overview?.recentAttempts.length ? (
              <ol className="recent-list">
                {overview.recentAttempts.map((attempt) => (
                  <li key={attempt.attemptId}>
                    <div>
                      <strong>{attempt.title}</strong>
                      <span>{attempt.categoryName}</span>
                    </div>
                    <span className="score-pill">{attempt.score} · {attempt.rating}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="empty-state compact-empty">
                <strong>{status === "authenticated" ? "还没有练习记录" : "登录后显示练习历史"}</strong>
                <span>提交一次回答后，这里会展示最近分数和 FSRS 评级。</span>
              </div>
            )}
          </article>

          <article className="ai-usage-panel">
            <div className="section-title">
              <BarChart3 size={20} />
              <h2>AI 用量</h2>
            </div>
            {loading ? (
              <DashboardSkeleton />
            ) : formattedUsage && usageSummary ? (
              <>
                <dl className="usage-facts">
                  <div>
                    <dt>任务数</dt>
                    <dd>{formattedUsage.totalJobs}</dd>
                  </div>
                  <div>
                    <dt>成功率</dt>
                    <dd>{formattedUsage.successRate}</dd>
                  </div>
                  <div>
                    <dt>Token</dt>
                    <dd>{formattedUsage.totalTokenUsage}</dd>
                  </div>
                  <div>
                    <dt>估算成本</dt>
                    <dd>{formattedUsage.estimatedCost}</dd>
                  </div>
                </dl>
                <p className="usage-note">
                  平均延迟 {formattedUsage.averageLatency}，失败任务 {usageSummary.failedJobs} 个。这里只展示元数据，不展示简历或回答正文。
                </p>
                {failedJobs.length > 0 ? (
                  <ol className="failed-job-list" aria-label="最近失败的 AI 任务">
                    {failedJobs.map((job) => {
                      const failedJob = formatAiJobFailureSummary(job);
                      return (
                        <li key={job.id}>
                          <strong>{failedJob.type}</strong>
                          <span>{failedJob.error}</span>
                          <em>{failedJob.retryCount}</em>
                        </li>
                      );
                    })}
                  </ol>
                ) : null}
              </>
            ) : (
              <div className="empty-state compact-empty">
                <strong>{status === "authenticated" ? "暂无 AI 任务" : "登录后显示 AI 用量"}</strong>
                <span>生成题目、答案或评分后，这里会聚合 token、延迟和估算成本。</span>
              </div>
            )}
          </article>
        </div>
      </section>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );
}

function toErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return `${error.message} (${error.status})`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "复习数据加载失败，请稍后重试。";
}
