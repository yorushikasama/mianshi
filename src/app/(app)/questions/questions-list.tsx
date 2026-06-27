"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownSelect } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/shiny-button";
import { NumberedPagination } from "@/components/ui/pagination";
import { Panel } from "@/components/ui/panel";
import { Textarea } from "@/components/ui/textarea";
import { Toolbar } from "@/components/ui/toolbar";

type Question = {
  id: string;
  type: string;
  typeLabel: string;
  title: string;
  source: string;
  difficulty: string;
  tags: string[];
  answer?: string;
  answerOption?: string;
};

const pageSize = 6;

export function QuestionsList({ questions }: { questions: Question[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [source, setSource] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [status, setStatus] = useState("active");
  const [type, setType] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingIds, setEditingIds] = useState<string[]>([]);
  const [states, setStates] = useState<Record<string, "active" | "archived" | "deleted">>({});
  const filtered = questions.filter((question) => {
    const itemState = states[question.id] ?? "active";

    return (
      (source === "all" || question.source === source) &&
      (difficulty === "all" || question.difficulty === difficulty) &&
      (type === "all" || question.type === type) &&
      (status === "all" || itemState === status)
    );
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = (currentPage - 1) * pageSize;
  const pageQuestions = filtered.slice(start, start + pageSize);

  useEffect(() => {
    setSavedIds(JSON.parse(window.localStorage.getItem("mianshi:saved-question-ids") ?? "[]") as string[]);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [source, difficulty, status, type]);

  function bulkSet(nextState: "active" | "archived" | "deleted") {
    setStates((current) => ({
      ...current,
      ...Object.fromEntries(selectedIds.map((id) => [id, nextState]))
    }));
    setSelectedIds([]);
  }

  function toggleSelected(id: string) {
    setSelectedIds((ids) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]);
  }

  function toggleEditing(id: string) {
    setEditingIds((ids) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]);
  }

  if (questions.length === 0) {
    return (
      <EmptyState
        action="去生成题目"
        description="先通过岗位目标、资料或薄弱点生成一批候选题。"
        title="题库还没有题目"
      />
    );
  }

  return (
    <main className="grid gap-[18px]">
      <Panel badge="题库" badgeVariant="hot" title="题库概览">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {[
            ["总题数", questions.length],
            ["问答题", questions.filter((item) => item.type === "qa").length],
            ["选择题", questions.filter((item) => item.type === "single_choice").length],
            ["STAR/行为题", questions.filter((item) => item.type === "behavior_star").length],
            ["待复习", 1],
            ["薄弱点题", questions.filter((item) => item.source === "补薄弱点").length]
          ].map(([label, value]) => (
            <div className="rounded-2xl border border-[#17151f12] bg-white/70 p-3" key={label}>
              <span className="text-xs font-bold text-[#17151f73]">{label}</span>
              <strong className="mt-1 block text-2xl text-[#17151f]">{value}</strong>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="个人面试题库">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Toolbar>
            <DropdownSelect
              defaultValue="all"
              onValueChange={setSource}
              options={[
                { label: "全部方向", value: "all" },
                { label: "岗位目标", value: "岗位目标" },
                { label: "项目笔记", value: "项目笔记" },
                { label: "补薄弱点", value: "补薄弱点" }
              ]}
            />
            <DropdownSelect
              defaultValue="all"
              onValueChange={setDifficulty}
              options={[
                { label: "全部难度", value: "all" },
                { label: "中等", value: "中等" },
                { label: "偏难", value: "偏难" }
              ]}
            />
            <DropdownSelect
              defaultValue="active"
              onValueChange={setStatus}
              options={[
                { label: "全部状态", value: "all" },
                { label: "已入库", value: "active" },
                { label: "已归档", value: "archived" },
                { label: "已删除", value: "deleted" }
              ]}
            />
            <DropdownSelect
              defaultValue="all"
              onValueChange={setType}
              options={[
                { label: "全部题型", value: "all" },
                { label: "问答题", value: "qa" },
                { label: "选择题", value: "single_choice" },
                { label: "STAR/行为题", value: "behavior_star" }
              ]}
            />
          </Toolbar>
          <div aria-label="批量操作" className="flex flex-wrap gap-2">
            <Button disabled={selectedIds.length === 0} onClick={() => bulkSet("archived")} size="sm">批量归档</Button>
            <Button disabled={selectedIds.length === 0} onClick={() => bulkSet("active")} size="sm">批量恢复</Button>
            <Button disabled={selectedIds.length === 0} onClick={() => bulkSet("deleted")} size="sm">批量删除</Button>
          </div>
        </div>
        {filtered.length === 0 ? (
          <EmptyState description="换一个方向、难度、状态或题型筛选。" title="没有符合条件的题目" />
        ) : (
          <>
            <div className="grid gap-3.5">
              {pageQuestions.map((question) => {
                const itemState = states[question.id] ?? "active";
                const isEditing = editingIds.includes(question.id);

                return (
                  <article className="grid gap-3 rounded-[18px] border border-[#17151f14] bg-white/70 p-4" key={question.id}>
                    <div className="grid grid-cols-[28px_minmax(0,1fr)_minmax(220px,auto)_120px] items-start gap-4 max-[920px]:grid-cols-[28px_minmax(0,1fr)]">
                      <Checkbox
                        className="mt-1"
                        checked={selectedIds.includes(question.id)}
                        onCheckedChange={() => toggleSelected(question.id)}
                      />
                      <div className="grid min-w-0 gap-1">
                        <Link className="font-black text-[#17151f] hover:underline" href={`/questions/${question.id}`}>{question.title}</Link>
                        <small className="text-[0.9rem] text-[#17151f8f]">{question.source} · {question.tags.join(" / ")}</small>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2 max-[920px]:col-start-2 max-[920px]:justify-start">
                        <Badge variant={itemState === "archived" ? "default" : itemState === "deleted" ? "hot" : "ok"}>
                          {itemState === "archived" ? "已归档" : itemState === "deleted" ? "已删除" : savedIds.includes(question.id) ? "最近入库" : "已入库"}
                        </Badge>
                        <Badge>{question.typeLabel}</Badge>
                        <Badge>{question.difficulty}</Badge>
                      </div>
                      <button
                        aria-expanded={isEditing}
                        className="justify-self-start whitespace-nowrap rounded-full px-2 py-1 text-left font-black text-[#17151f] hover:bg-[#17151f0a] max-[920px]:col-start-2"
                        onClick={() => toggleEditing(question.id)}
                        type="button"
                      >
                        {isEditing ? "▾ 单题编辑" : "▸ 单题编辑"}
                      </button>
                    </div>
                    {isEditing ? (
                      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3 border-t border-[#17151f14] pt-3">
                        <FormField label="题干">
                          <Input defaultValue={question.title} />
                        </FormField>
                        <FormField label="标签">
                          <Input defaultValue={question.tags.join("、")} />
                        </FormField>
                        <FormField label={question.type === "single_choice" ? "正确选项" : "参考答案"}>
                          {question.type === "single_choice" ? (
                            <Input defaultValue={question.answerOption ?? ""} />
                          ) : (
                            <Textarea className="min-h-28" defaultValue={question.answer ?? ""} />
                          )}
                        </FormField>
                        <div className="self-end">
                          <Button size="sm" type="button" variant="solid">保存编辑</Button>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>

            <NumberedPagination
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              totalPages={totalPages}
            />
          </>
        )}
      </Panel>
    </main>
  );
}
