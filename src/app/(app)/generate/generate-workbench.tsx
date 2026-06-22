"use client";

import { useState } from "react";
import { candidateQuestions, documents, targets } from "@/lib/mock-data";
import AnimatedLoadingSkeleton from "@/components/ui/animated-loading-skeleton";
import { Badge } from "@/components/ui/badge";
import { useFileInput } from "@/components/hooks/use-file-input";
import { DropdownSelect } from "@/components/ui/dropdown-menu";
import { FileUploadButton } from "@/components/ui/file-upload-button";
import { FormField } from "@/components/ui/form-field";
import LoaderOne from "@/components/ui/loader-one";
import { Button } from "@/components/ui/shiny-button";
import { Panel } from "@/components/ui/panel";

type CandidateState = "pending" | "skipped" | "saved";
type GenerateMode = "materials" | "target";

type Candidate = (typeof candidateQuestions)[number] & {
  selected: boolean;
  state: CandidateState;
};

export function GenerateWorkbench({ materialId }: { materialId?: string }) {
  const [mode, setMode] = useState<GenerateMode>(materialId ? "materials" : "target");
  const [status, setStatus] = useState<"idle" | "generating" | "done" | "failed">("idle");
  const [selectedMaterialId, setSelectedMaterialId] = useState(materialId ?? documents[0]?.id ?? "");
  const [candidates, setCandidates] = useState<Candidate[]>(
    candidateQuestions.map((question) => ({ ...question, selected: true, state: "pending" }))
  );
  const materialUpload = useFileInput({ maxSize: 10 });
  const sourceMaterial = documents.find((item) => item.id === selectedMaterialId);

  const selectedCount = candidates.filter((question) => question.selected && question.state === "pending").length;
  const pendingCount = candidates.filter((question) => question.state === "pending").length;
  const savedCount = candidates.filter((question) => question.state === "saved").length;
  const skippedCount = candidates.filter((question) => question.state === "skipped").length;

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
    <main className="grid gap-5">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Panel badge="出题委托单" badgeVariant="hot" className="relative z-20" title="AI 生成候选题">
          <div className="grid gap-5">
            <p className="m-0 max-w-3xl text-[0.95rem] leading-relaxed text-[#17151f99]">
              选择资料生成或目标生成，AI 自动判定题型并生成候选题。
            </p>

            <div className="grid gap-3 md:grid-cols-2">
              {[
                ["materials", "按资料生成", "简历、JD、项目笔记、知识点资料"] as const,
                ["target", "按目标生成", "岗位、级别、技术栈、薄弱点"] as const
              ].map(([value, title, desc]) => (
                <button
                  className={[
                    "rounded-[18px] border p-4 text-left transition hover:-translate-y-px",
                    mode === value
                      ? "border-black bg-black text-white shadow-[0_18px_42px_rgba(23,21,31,0.16)]"
                      : "border-[#17151f14] bg-white/60 text-[#17151f] hover:bg-white/90"
                  ].join(" ")}
                  key={value}
                  onClick={() => setMode(value)}
                  type="button"
                >
                  <strong className="block text-lg font-black">{title}</strong>
                  <span className={mode === value ? "mt-1 block text-sm text-white/68" : "mt-1 block text-sm text-[#17151f8f]"}>
                    {desc}
                  </span>
                </button>
              ))}
            </div>

            {mode === "materials" ? (
              <div className="grid gap-4">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.72fr)]">
                  <FormField label="选择已有资料">
                    <DropdownSelect
                      defaultValue={selectedMaterialId}
                      onValueChange={setSelectedMaterialId}
                      options={documents.map((item) => ({ label: `${item.type} · ${item.name}`, value: item.id }))}
                    />
                  </FormField>
                  <FormField label="上传新资料">
                    <div className="grid gap-2">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <FileUploadButton
                          accept=".pdf,.doc,.docx,.md,.txt"
                          inputRef={materialUpload.fileInputRef}
                          onFileChange={materialUpload.handleFileSelect}
                        />
                        {materialUpload.fileName ? (
                          <Button onClick={materialUpload.clearFile} size="sm" variant="ghost">
                            清除
                          </Button>
                        ) : null}
                      </div>
                      {materialUpload.fileName ? (
                        <p className="m-0 text-sm font-semibold text-[#17151fcc]">
                          已选择：{materialUpload.fileName}
                          <span className="ml-2 font-medium text-[#17151f73]">
                            {(materialUpload.fileSize / (1024 * 1024)).toFixed(2)}MB
                          </span>
                        </p>
                      ) : (
                        <p className="m-0 text-sm text-[#17151f73]">支持 PDF、Word、Markdown、TXT，单文件 10MB 内。</p>
                      )}
                      {materialUpload.error ? (
                        <p className="m-0 text-sm font-semibold text-red-500">{materialUpload.error}</p>
                      ) : null}
                    </div>
                  </FormField>
                </div>
                {sourceMaterial ? (
                  <div className="grid gap-3 rounded-[18px] border border-[#17151f14] bg-white/55 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="ok">{sourceMaterial.status}</Badge>
                      <strong className="text-[#17151f]">来自资料：{sourceMaterial.name}</strong>
                    </div>
                    <p className="m-0 text-[0.92rem] leading-relaxed text-[#17151f99]">{sourceMaterial.summary}</p>
                    <div className="flex flex-wrap gap-2">
                      {sourceMaterial.generationDirections.map((item) => (
                        <Badge key={item}>{item}</Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.72fr)]">
                <FormField label="目标岗位">
                  <input defaultValue={`${targets.level} ${targets.role}`} />
                </FormField>
                <FormField label="生成方向">
                  <DropdownSelect
                    defaultValue="target"
                    options={[
                      { label: "岗位目标", value: "target" },
                      { label: "补薄弱点", value: "weak" },
                      { label: "项目追问", value: "project" }
                    ]}
                  />
                </FormField>
                <FormField className="lg:col-span-2" label="重点技术">
                  <textarea className="h-24 min-h-24 leading-[1.5]" defaultValue={targets.stack.join("、")} />
                </FormField>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button onClick={generate} variant="solid">
                生成候选题
              </Button>
              <Button onClick={() => setStatus("failed")}>
                模拟失败
              </Button>
            </div>
          </div>
        </Panel>

        <Panel as="aside" className="grid content-start gap-4" title="本次生成">
          <div className="grid grid-cols-3 gap-2.5 xl:grid-cols-1">
            <div className="rounded-2xl border border-[#17151f14] bg-white/65 p-3">
              <span className="text-xs font-bold text-[#17151f73]">待确认</span>
              <strong className="mt-1 block text-2xl text-[#17151f]">{pendingCount}</strong>
            </div>
            <div className="rounded-2xl border border-teal-200 bg-teal-50 p-3">
              <span className="text-xs font-bold text-teal-700/75">已入库</span>
              <strong className="mt-1 block text-2xl text-teal-800">{savedCount}</strong>
            </div>
            <div className="rounded-2xl border border-[#17151f14] bg-white/65 p-3">
              <span className="text-xs font-bold text-[#17151f73]">已跳过</span>
              <strong className="mt-1 block text-2xl text-[#17151f]">{skippedCount}</strong>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-[0.92rem] font-bold text-[#17151f9e]" aria-live="polite">
            {status === "generating" ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Badge variant="hot">生成中</Badge>
                <LoaderOne />
              </span>
            ) : null}
            {status === "done" ? <Badge variant="ok">生成完成</Badge> : null}
            {status === "failed" ? <Badge>生成失败</Badge> : null}
            {status === "idle" ? <Badge>等待生成</Badge> : null}
            <span>已选择 {selectedCount} 题</span>
          </div>
        </Panel>
      </section>

      {status === "generating" ? <AnimatedLoadingSkeleton /> : null}

      <Panel
        actions={
          <Button disabled={selectedCount === 0} onClick={confirmSelected} variant="solid">
            批量确认入库
          </Button>
        }
        title="候选题队列"
      >
        <div className="grid gap-3.5">
          {candidates.map((question) => (
            <article
              className="grid gap-4 rounded-[18px] border border-[#17151f14] bg-white/70 p-4 transition hover:border-[#17151f29] hover:bg-white/90 md:p-5"
              key={question.id}
            >
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                <label className="flex min-w-0 items-start gap-3">
                  <input
                    className="mt-1 h-4 w-4 shrink-0 accent-[#17151f]"
                    checked={question.selected}
                    disabled={question.state !== "pending"}
                    onChange={() => toggle(question.id)}
                    type="checkbox"
                  />
                  <span className="grid min-w-0 gap-1">
                    <strong className="text-balance text-base font-black leading-snug text-[#17151f] md:text-lg">
                      {question.title}
                    </strong>
                    <small className="text-[0.9rem] leading-relaxed text-[#17151f8f]">
                      {question.typeLabel} · {question.source} · {question.difficulty}
                    </small>
                  </span>
                </label>
                <div className="flex shrink-0 flex-wrap items-center gap-2.5 md:justify-end">
                  <Badge variant={question.state === "saved" ? "ok" : "default"}>
                    {question.state === "saved" ? "已入库" : question.state === "skipped" ? "已跳过" : "待确认"}
                  </Badge>
                  <Button onClick={() => skip(question.id)} size="sm">
                    跳过
                  </Button>
                </div>
              </div>

              <details className="border-t border-[#17151f14] pt-3">
                <summary className="cursor-pointer font-black text-[#17151f]">编辑候选题</summary>
                <div className="mt-3 grid items-start gap-3 lg:grid-cols-[minmax(260px,1fr)_minmax(180px,0.6fr)_minmax(260px,1fr)_minmax(320px,1fr)]">
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
                      className="min-h-28 leading-[1.5]"
                      defaultValue={question.answer ?? question.explanation ?? ""}
                    />
                  </FormField>
                </div>
                {question.type === "single_choice" ? (
                  <div className="mt-3 grid gap-2.5">
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
