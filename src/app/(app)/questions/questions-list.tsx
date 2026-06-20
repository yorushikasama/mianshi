"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DropdownSelect } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/neon-button";
import { NumberedPagination } from "@/components/ui/pagination";
import { Panel } from "@/components/ui/panel";
import { Toolbar } from "@/components/ui/toolbar";

type Question = {
  id: string;
  type: string;
  typeLabel: string;
  title: string;
  source: string;
  difficulty: string;
  tags: string[];
};

const pageSize = 2;

export function QuestionsList({ questions }: { questions: Question[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [source, setSource] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [status, setStatus] = useState("active");
  const [type, setType] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
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

  if (questions.length === 0) {
    return (
      <EmptyState
        action="去生成题目"
        actionProps={{ variant: "solid" }}
        description="先通过岗位目标、资料或薄弱点生成一批候选题。"
        title="题库还没有题目"
      />
    );
  }

  return (
    <main className="page-stack">
      <Panel badge="题库" className="floating-controls-panel questions-filter-panel" title="个人面试题库">
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
              { label: "已入库", value: "active" },
              { label: "已归档", value: "archived" },
              { label: "已删除", value: "deleted" },
              { label: "全部状态", value: "all" }
            ]}
          />
          <DropdownSelect
            defaultValue="all"
            onValueChange={setType}
            options={[
              { label: "全部题型", value: "all" },
              { label: "问答题", value: "qa" },
              { label: "选择题", value: "single_choice" }
            ]}
          />
        </Toolbar>
      </Panel>

      <Panel
        actions={
          <Toolbar>
            <Button disabled={selectedIds.length === 0} onClick={() => bulkSet("archived")} size="sm">批量归档</Button>
            <Button disabled={selectedIds.length === 0} onClick={() => bulkSet("active")} size="sm">批量恢复</Button>
            <Button disabled={selectedIds.length === 0} onClick={() => bulkSet("deleted")} size="sm">批量删除</Button>
          </Toolbar>
        }
        title="批量操作"
      >
        {filtered.length === 0 ? (
          <EmptyState description="换一个方向、难度、状态或题型筛选。" title="没有符合条件的题目" />
        ) : (
          <>
            <div className="list">
              {pageQuestions.map((question) => {
                const itemState = states[question.id] ?? "active";

                return (
                  <article className="question-row list-row" key={question.id}>
                    <label className="candidate-row__select">
                      <input
                        checked={selectedIds.includes(question.id)}
                        onChange={() => toggleSelected(question.id)}
                        type="checkbox"
                      />
                      <span>
                        <Link href={`/questions/${question.id}`}><strong>{question.title}</strong></Link>
                        <small>{question.typeLabel} · {question.source} · {question.difficulty}</small>
                      </span>
                    </label>
                    <Toolbar>
                      <Badge variant={itemState === "archived" ? "default" : itemState === "deleted" ? "hot" : "ok"}>
                        {itemState === "archived" ? "已归档" : itemState === "deleted" ? "已删除" : savedIds.includes(question.id) ? "最近入库" : "已入库"}
                      </Badge>
                    </Toolbar>
                    <details className="candidate-editor">
                      <summary>单题编辑</summary>
                      <div className="form-grid">
                        <FormField label="题干">
                          <input defaultValue={question.title} />
                        </FormField>
                        <FormField label="标签">
                          <input defaultValue={question.tags.join("、")} />
                        </FormField>
                      </div>
                    </details>
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
