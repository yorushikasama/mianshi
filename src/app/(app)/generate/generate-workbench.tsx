"use client";

import { useState } from "react";
import { candidateQuestions, documents, targets } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { DropdownSelect } from "@/components/ui/dropdown-menu";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/neon-button";
import { Panel } from "@/components/ui/panel";
import { Toolbar } from "@/components/ui/toolbar";

type CandidateState = "pending" | "skipped" | "saved";

type Candidate = (typeof candidateQuestions)[number] & {
  selected: boolean;
  state: CandidateState;
};

export function GenerateWorkbench({ materialId }: { materialId?: string }) {
  const [status, setStatus] = useState<"idle" | "generating" | "done" | "failed">("idle");
  const [candidates, setCandidates] = useState<Candidate[]>(
    candidateQuestions.map((question) => ({ ...question, selected: true, state: "pending" }))
  );
  const sourceMaterial = documents.find((item) => item.id === materialId);

  const selectedCount = candidates.filter((question) => question.selected && question.state === "pending").length;
  const savedCount = candidates.filter((question) => question.state === "saved").length;

  function generate() {
    setStatus("generating");
    window.setTimeout(() => setStatus("done"), 500);
  }

function confirmSelected() {
    const savedIds = candidates
      .filter((item) => item.selected && item.state === "pending")
      .map((item) => item.id);

    if (savedIds.length > 0) {
      const current = JSON.parse(window.localStorage.getItem("mianshi:saved-question-ids") ?? "[]") as string[];
      window.localStorage.setItem(
        "mianshi:saved-question-ids",
        JSON.stringify(Array.from(new Set([...current, ...savedIds])))
      );
    }

    setCandidates((items) =>
      items.map((item) =>
        item.selected && item.state === "pending" ? { ...item, state: "saved", selected: false } : item
      )
    );
  }

  function toggle(id: string) {
    setCandidates((items) =>
      items.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  }

  function skip(id: string) {
    setCandidates((items) =>
      items.map((item) => (item.id === id ? { ...item, state: "skipped", selected: false } : item))
    );
  }

  return (
    <main className="page-stack">
      <Panel
        badge="出题委托单"
        badgeVariant="hot"
        className="floating-controls-panel generation-brief-panel"
        relaxed
        title="AI 生成候选题"
      >
        <p>AI 自动判定题型，会按岗位和资料混合生成问答题与选择题。</p>
        {sourceMaterial ? <Badge variant="ok">来自资料：{sourceMaterial.name}</Badge> : null}
        <div className="form-grid">
          <FormField label="目标岗位">
            <input defaultValue={`${targets.level} ${targets.role}`} />
          </FormField>
          <FormField label="重点技术">
            <textarea className="compact-textarea" defaultValue={targets.stack.join("、")} />
          </FormField>
          <FormField label="生成模式">
            <DropdownSelect
              defaultValue="target"
              options={[
                { label: "岗位目标", value: "target" },
                { label: "资料增强", value: "materials" },
                { label: "补薄弱点", value: "weak" }
              ]}
            />
          </FormField>
        </div>
        <Toolbar>
          <Button onClick={generate} variant="solid">
            生成候选题
          </Button>
          <Button onClick={() => setStatus("failed")} neon={false}>
            模拟失败
          </Button>
        </Toolbar>
        <div className="generation-status" aria-live="polite">
          {status === "generating" ? <Badge variant="hot">生成中</Badge> : null}
          {status === "done" ? <Badge variant="ok">生成完成</Badge> : null}
          {status === "failed" ? <Badge>生成失败</Badge> : null}
          <span>已入库 {savedCount} 题</span>
        </div>
      </Panel>

      <Panel
        actions={
          <Button disabled={selectedCount === 0} onClick={confirmSelected} variant="solid">
            批量确认入库
          </Button>
        }
        title="批量确认"
      >
        <div className="list">
          {candidates.map((question) => (
            <article className="candidate-row list-row" key={question.id}>
              <label className="candidate-row__select">
                <input
                  checked={question.selected}
                  disabled={question.state !== "pending"}
                  onChange={() => toggle(question.id)}
                  type="checkbox"
                />
                <span>
                  <strong>{question.title}</strong>
                  <small>{question.typeLabel} · {question.source} · {question.difficulty}</small>
                </span>
              </label>
              <Toolbar>
                <Button neon={false} onClick={() => skip(question.id)} size="sm">
                  跳过
                </Button>
                <Badge variant={question.state === "saved" ? "ok" : "default"}>
                  {question.state === "saved" ? "已入库" : question.state === "skipped" ? "已跳过" : "待确认"}
                </Badge>
              </Toolbar>
              <details className="candidate-editor">
                <summary>编辑候选题</summary>
                <div className="form-grid">
                  <FormField label="题干">
                    <input defaultValue={question.title} />
                  </FormField>
                  <FormField label="题型">
                    <DropdownSelect
                      defaultValue={question.type}
                      options={[
                        { label: "问答题", value: "qa" },
                        { label: "选择题", value: "single_choice" }
                      ]}
                    />
                  </FormField>
                  <FormField label="标签">
                    <input defaultValue={question.tags.join("、")} />
                  </FormField>
                  <FormField label="答案">
                    <textarea
                      className="compact-textarea"
                      defaultValue={question.answer ?? question.explanation ?? ""}
                    />
                  </FormField>
                </div>
                {question.type === "single_choice" ? (
                  <div className="choice-list">
                    {(question.options ?? []).map((option) => (
                      <FormField key={option.key} label={`选项 ${option.key}`}>
                        <input defaultValue={option.text} />
                      </FormField>
                    ))}
                  </div>
                ) : null}
              </details>
            </article>
          ))}
        </div>
      </Panel>
    </main>
  );
}
