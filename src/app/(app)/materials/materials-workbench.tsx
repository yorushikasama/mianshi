"use client";

import { useState } from "react";
import { documents } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ListRow } from "@/components/ui/list-row";
import { Panel } from "@/components/ui/panel";

const demoQueue = [
  { name: "中高级前端简历.pdf", status: "上传中" },
  { name: "前端工程师 JD.md", status: "解析中" },
  { name: "项目复盘笔记.md", status: "已解析" },
  { name: "旧版八股复习.docx", status: "解析失败" }
];

export function MaterialsWorkbench() {
  const [queue, setQueue] = useState(demoQueue);

  return (
    <main className="page-stack">
      <Panel badge="资料收纳箱" title="简历、JD、项目笔记、复习资料">
        <label className="neon-button neon-button--solid neon-button--default-size material-upload-button">
          选择资料文件
          <input
            multiple
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              if (files.length > 0) {
                setQueue(files.map((file) => ({ name: file.name, status: "上传中" })));
              }
            }}
            type="file"
          />
        </label>
      </Panel>

      <Panel title="上传队列" description="前端 mock 展示上传、解析和失败状态，暂不真实保存文件。">
        <div className="list">
          {queue.map((item) => (
            <ListRow
              action={<Badge variant={item.status === "已解析" ? "ok" : item.status === "解析中" ? "hot" : "default"}>{item.status}</Badge>}
              key={`${item.name}-${item.status}`}
              meta="上传后由 AI 解析为知识点、项目点和可生成题目方向"
              title={item.name}
            />
          ))}
        </div>
      </Panel>

      <Panel>
        {documents.length > 0 ? (
          <div className="list">
            {documents.map((doc) => (
              <ListRow
                action={<Badge>{doc.linked} 题</Badge>}
                href={`/materials/${doc.id}`}
                key={doc.name}
                meta={`${doc.type} · ${doc.status}`}
                title={doc.name}
              />
            ))}
          </div>
        ) : (
          <EmptyState description="上传简历、JD、项目笔记或复习资料后，可以批量生成候选题。" title="资料箱还是空的" />
        )}
      </Panel>
    </main>
  );
}
