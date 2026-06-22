"use client";

import { useState } from "react";
import { documents } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { FileUploadButton } from "@/components/ui/file-upload-button";
import { Button } from "@/components/ui/shiny-button";
import { EmptyState } from "@/components/ui/empty-state";
import { ListRow } from "@/components/ui/list-row";
import { Panel } from "@/components/ui/panel";

type QueueStatus = "上传中" | "解析中" | "已解析" | "解析失败";
type QueueItem = { name: string; status: QueueStatus };

const demoQueue = [
  { name: "中高级前端简历.pdf", status: "上传中" },
  { name: "前端工程师 JD.md", status: "解析中" },
  { name: "项目复盘笔记.md", status: "已解析" },
  { name: "旧版八股复习.docx", status: "解析失败" }
] satisfies QueueItem[];

function statusVariant(status: QueueStatus) {
  if (status === "已解析") return "ok";
  if (status === "解析中") return "hot";
  return "default";
}

export function MaterialsWorkbench() {
  const [queue, setQueue] = useState(demoQueue);
  const parsedCount = documents.filter((doc) => doc.status === "已解析").length;
  const linkedCount = documents.reduce((total, doc) => total + doc.linked, 0);

  return (
    <main className="grid gap-5">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Panel badge="资料收纳箱" badgeVariant="hot" title="把资料变成可追问的题库来源">
          <div className="grid gap-5">
            <p className="m-0 max-w-3xl text-[0.95rem] leading-relaxed text-[#17151f99]">
              上传简历、JD、项目笔记或复习资料，AI 解析后可以按资料批量生成候选题。
            </p>

            <div className="rounded-[20px] border border-dashed border-[#17151f24] bg-white/60 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="grid gap-1">
                  <strong className="text-lg font-black text-[#17151f]">选择资料文件</strong>
                  <span className="text-sm font-semibold text-[#17151f73]">支持 PDF、Word、Markdown、TXT，可多选。</span>
                </div>
                <FileUploadButton
                  accept=".pdf,.doc,.docx,.md,.txt"
                  multiple
                  onFileChange={(event) => {
                    const files = Array.from(event.target.files ?? []);
                    if (files.length > 0) {
                      setQueue(files.map((file) => ({ name: file.name, status: "上传中" })));
                    }
                  }}
                  variant="solid"
                />
              </div>
            </div>
          </div>
        </Panel>

        <Panel as="aside" className="grid content-start gap-4" title="资料概览">
          <div className="grid gap-2.5 sm:grid-cols-3 xl:grid-cols-1">
            {[
              ["资料", documents.length],
              ["已解析", parsedCount],
              ["关联题", linkedCount]
            ].map(([label, value]) => (
              <div className="rounded-2xl border border-[#17151f14] bg-white/65 p-3" key={label}>
                <span className="text-xs font-bold text-[#17151f73]">{label}</span>
                <strong className="mt-1 block text-2xl text-[#17151f]">{value}</strong>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <Panel title="上传队列" description="前端 mock 展示上传、解析和失败状态，暂不真实保存文件。">
        <div className="grid gap-3.5 md:grid-cols-2">
          {queue.map((item) => (
            <ListRow
              action={<Badge variant={statusVariant(item.status)}>{item.status}</Badge>}
              key={`${item.name}-${item.status}`}
              meta="上传后由 AI 解析为知识点、项目点和可生成题目方向"
              title={item.name}
            />
          ))}
        </div>
      </Panel>

      <Panel title="资料库" description="点击资料查看解析摘要、关联题目和可生成方向。">
        {documents.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {documents.map((doc) => (
              <article
                className="grid content-between gap-4 rounded-[18px] border border-[#17151f14] bg-white/70 p-4 transition hover:border-[#17151f29] hover:bg-white/90"
                key={doc.name}
              >
                <div className="grid gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid gap-1">
                      <strong className="text-lg font-black leading-snug text-[#17151f]">{doc.name}</strong>
                      <span className="text-sm font-semibold text-[#17151f73]">{doc.type} · {doc.status}</span>
                    </div>
                    <Badge>{doc.linked} 题</Badge>
                  </div>
                  <p className="m-0 text-[0.92rem] leading-relaxed text-[#17151f99]">{doc.summary}</p>
                  <div className="flex flex-wrap gap-2">
                    {doc.generationDirections.map((item) => (
                      <Badge key={item}>{item}</Badge>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <Button href={`/materials/${doc.id}`} size="sm">查看资料</Button>
                  <Button href={`/generate?material=${doc.id}`} size="sm" variant="solid">去生成</Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState description="上传简历、JD、项目笔记或复习资料后，可以批量生成候选题。" title="资料箱还是空的" />
        )}
      </Panel>
    </main>
  );
}
