"use client";

import { useState } from "react";
import { candidateQuestions, weakAreas } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/shiny-button";
import { Panel } from "@/components/ui/panel";

const filters = ["全部", "复习到期", "错题", "薄弱点题"] as const;

const reviewItems = [
  { questionId: "next-app-router", status: "复习到期", reason: "3 天未复述", priority: "高", action: "开始复述" },
  { questionId: "frontend-degrade", status: "错题", reason: "上次选择错误", priority: "高", action: "重做选择" },
  { questionId: "performance-project", status: "薄弱点题", reason: "项目复盘表达 42 分", priority: "中", action: "练表达" }
];

export default function PracticeReviewPage() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("全部");
  const visibleItems = reviewItems.filter((item) => filter === "全部" || item.status === filter);
  const filterCount = (name: (typeof filters)[number]) =>
    name === "全部" ? reviewItems.length : reviewItems.filter((item) => item.status === name).length;

  return (
    <main className="grid gap-[18px]">
      <Panel
        actions={<Button href="/practice" size="sm">返回练习</Button>}
        badge="复习计划"
        badgeVariant="hot"
        description="把到期题、错题和薄弱点题放在一个复习队列里。"
        title="今天先复习这些"
      >
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            ["今日到期", "1 题"],
            ["错题", "1 题"],
            ["薄弱点", `${weakAreas.length} 个`]
          ].map(([label, value]) => (
            <div className="rounded-2xl border border-[#17151f12] bg-white/70 p-4" key={label}>
              <span className="text-xs font-bold text-[#17151f73]">{label}</span>
              <strong className="mt-1 block text-2xl text-[#17151f]">{value}</strong>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-2xl border border-pink-200 bg-pink-50 p-4">
          <span className="text-xs font-bold text-pink-700/75">优先建议</span>
          <strong className="mt-1 block text-lg text-pink-800">先处理错题和到期题，再补薄弱点表达。</strong>
        </div>
      </Panel>

      <Panel title="复习队列">
        <div className="mb-4 flex flex-wrap gap-2 rounded-2xl border border-[#17151f12] bg-white/55 p-2">
          {filters.map((item) => (
            <button
              className={[
                "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition",
                filter === item ? "bg-black text-white" : "text-[#17151f99] hover:bg-white hover:text-[#17151f]"
              ].join(" ")}
              key={item}
              onClick={() => setFilter(item)}
              type="button"
            >
              {item}
              <span className={filter === item ? "text-white/60" : "text-[#17151f66]"}>
                {filterCount(item)}
              </span>
            </button>
          ))}
        </div>
        <div className="grid gap-3">
          {visibleItems.map((item) => {
            const question = candidateQuestions.find((entry) => entry.id === item.questionId);
            if (!question) return null;

            return (
              <article
                className="grid gap-3 rounded-2xl border border-[#17151f12] bg-white/70 p-4 transition hover:border-[#17151f29] hover:bg-white md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
                key={item.questionId}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={item.status === "复习到期" || item.status === "错题" ? "hot" : "default"}>
                      {item.status}
                    </Badge>
                    <Badge variant={item.priority === "高" ? "hot" : "default"}>优先级 {item.priority}</Badge>
                    <span className="text-sm font-bold text-[#17151f73]">{question.typeLabel} · {question.difficulty}</span>
                  </div>
                  <strong className="mt-2 block text-[#17151f]">{question.title}</strong>
                  <span className="mt-1 block text-sm text-[#17151f73]">{item.reason}</span>
                </div>
                <Button href={`/practice/${question.id}`} size="sm" variant={item.priority === "高" ? "solid" : "default"}>
                  {item.action}
                </Button>
              </article>
            );
          })}
        </div>
      </Panel>
    </main>
  );
}
