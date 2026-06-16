"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { AiJob, DocumentType, SourceDocument } from "@mianshi/shared";
import { documentTypes } from "@mianshi/shared";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  DatabaseZap,
  FileText,
  Loader2,
  LockKeyhole,
  RefreshCw,
  UploadCloud,
} from "lucide-react";
import { useAuth } from "./auth-provider";
import { ApiError, createSourceDocument, fetchAiJobs, fetchSourceDocuments } from "@/lib/api";

const documentTypeLabels: Record<DocumentType, string> = {
  resume: "简历",
  job_description: "岗位 JD",
  project_note: "项目笔记",
  learning_note: "学习笔记",
};

const documentTypeHints: Record<DocumentType, string> = {
  resume: "粘贴简历中和 Java 后端、项目经历、性能优化、稳定性相关的部分。",
  job_description: "粘贴目标岗位 JD，系统后续会围绕岗位要求生成追问。",
  project_note: "粘贴项目背景、技术方案、指标结果和取舍，适合训练项目深挖。",
  learning_note: "粘贴学习笔记或错题总结，用于补齐概念类题目上下文。",
};

const jobStatusLabels: Record<AiJob["status"], string> = {
  pending: "等待中",
  running: "索引中",
  succeeded: "已完成",
  failed: "失败",
  canceled: "已取消",
};

export function DocumentWorkbench() {
  const { status, user } = useAuth();
  const [documentType, setDocumentType] = useState<DocumentType>("resume");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [documents, setDocuments] = useState<SourceDocument[]>([]);
  const [jobs, setJobs] = useState<AiJob[]>([]);
  const [createdJob, setCreatedJob] = useState<AiJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isAuthenticated = status === "authenticated" && Boolean(user);
  const activeDocumentJob = useMemo(
    () => jobs.find((job) => job.type === "embed_document" && ["pending", "running"].includes(job.status)),
    [jobs],
  );
  const contentLength = content.trim().length;
  const canSubmit = isAuthenticated && title.trim().length > 0 && contentLength > 0 && !submitting;

  useEffect(() => {
    let active = true;

    async function loadDocuments() {
      if (!isAuthenticated) {
        setDocuments([]);
        setJobs([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [documentResult, jobResult] = await Promise.all([
          fetchSourceDocuments(),
          fetchAiJobs({ pageSize: 8 }),
        ]);

        if (active) {
          setDocuments(documentResult.items);
          setJobs(jobResult.items.filter((job) => job.type === "embed_document"));
        }
      } catch (loadError) {
        if (active) {
          setError(toErrorMessage(loadError));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (status !== "loading") {
      void loadDocuments();
    }

    return () => {
      active = false;
    };
  }, [isAuthenticated, status]);

  useEffect(() => {
    if (!isAuthenticated || !activeDocumentJob) {
      return;
    }

    const timer = window.setInterval(async () => {
      try {
        const [documentResult, jobResult] = await Promise.all([
          fetchSourceDocuments(),
          fetchAiJobs({ pageSize: 8 }),
        ]);
        setDocuments(documentResult.items);
        setJobs(jobResult.items.filter((job) => job.type === "embed_document"));
      } catch {
        window.clearInterval(timer);
      }
    }, 5000);

    return () => window.clearInterval(timer);
  }, [activeDocumentJob, isAuthenticated]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isAuthenticated) {
      setError("请先登录，再上传个人资料。");
      return;
    }

    if (!canSubmit) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await createSourceDocument({
        documentType,
        title,
        content,
      });
      setDocuments((currentDocuments) => [result.document, ...currentDocuments]);
      setJobs((currentJobs) => [result.job, ...currentJobs.filter((job) => job.id !== result.job.id)]);
      setCreatedJob(result.job);
      setTitle("");
      setContent("");
      setSuccess("资料已提交，后端会通过 BullMQ 异步切块并生成 embedding。");
    } catch (submitError) {
      setError(toErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="document-page">
      <header className="document-header">
        <a className="back-link" href="/">
          <ArrowLeft size={17} />
          返回工作台
        </a>
        <div className="document-header-grid">
          <div>
            <p className="eyebrow">RAG 资料库 · 用户隔离索引</p>
            <h1>把简历、JD 和项目笔记接入面试复习闭环</h1>
            <p>
              资料会先保存到服务器，再由异步任务切块、生成 embedding 并写入 pgvector。AI 生成题目或评分时只检索当前用户的相关片段。
            </p>
          </div>
          <aside className="document-safety-note">
            <LockKeyhole size={20} />
            <strong>不做离线敏感缓存</strong>
            <span>当前版本不会把简历、JD 或项目内容写入 PWA 离线缓存。</span>
          </aside>
        </div>
      </header>

      {!isAuthenticated ? (
        <section className="practice-auth-callout document-auth-callout" role="status">
          <LockKeyhole size={20} />
          <div>
            <strong>登录后使用个人 RAG 资料库</strong>
            <span>资料和检索结果必须按账号隔离，未登录时不允许提交或查看。</span>
          </div>
          <a href="/auth">登录 / 注册</a>
        </section>
      ) : null}

      {error ? (
        <div className="practice-error" role="alert">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      ) : null}

      {success ? (
        <div className="document-success" role="status">
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      ) : null}

      <section className="document-layout">
        <form className="document-form-panel" onSubmit={handleSubmit}>
          <div className="section-title">
            <UploadCloud size={20} />
            <h2>提交资料</h2>
          </div>

          <label htmlFor="document-type">资料类型</label>
          <select
            id="document-type"
            value={documentType}
            disabled={!isAuthenticated || submitting}
            onChange={(event) => setDocumentType(event.target.value as DocumentType)}
          >
            {documentTypes.map((type) => (
              <option key={type} value={type}>
                {documentTypeLabels[type]}
              </option>
            ))}
          </select>
          <p className="field-hint">{documentTypeHints[documentType]}</p>

          <label htmlFor="document-title">标题</label>
          <input
            id="document-title"
            value={title}
            disabled={!isAuthenticated || submitting}
            maxLength={200}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="例如：后端开发简历 2026 版"
          />

          <label htmlFor="document-content">正文</label>
          <textarea
            id="document-content"
            value={content}
            disabled={!isAuthenticated || submitting}
            maxLength={200000}
            onChange={(event) => setContent(event.target.value)}
            placeholder="粘贴简历、JD、项目笔记或学习笔记正文。建议保留项目背景、技术方案、指标结果和面试风险点。"
          />

          <div className="document-form-footer">
            <span>{contentLength.toLocaleString("zh-CN")} / 200,000 字</span>
            <button type="submit" disabled={!canSubmit}>
              {submitting ? <Loader2 className="spin-icon" size={17} /> : <DatabaseZap size={17} />}
              {submitting ? "提交索引中" : "提交并索引"}
            </button>
          </div>
        </form>

        <aside className="document-side-panel">
          <div className="section-title">
            <DatabaseZap size={20} />
            <h2>索引状态</h2>
          </div>

          {createdJob ? (
            <div className="document-job-card">
              <span className={`job-status ${createdJob.status}`}>{jobStatusLabels[createdJob.status]}</span>
              <strong>{createdJob.type}</strong>
              <p>任务已进入 AI 队列，完成后 chunk 数会在资料列表中更新。</p>
            </div>
          ) : (
            <div className="document-empty compact">
              <RefreshCw size={19} />
              <strong>提交后显示最新索引任务</strong>
              <span>任务状态来自后端 AI jobs，不在请求处理中执行长耗时 embedding。</span>
            </div>
          )}

          <ol className="document-job-list" aria-label="最近资料索引任务">
            {jobs.slice(0, 5).map((job) => (
              <li key={job.id}>
                <span className={`job-status ${job.status}`}>{jobStatusLabels[job.status]}</span>
                <div>
                  <strong>{formatDateTime(job.createdAt)}</strong>
                  <span>{job.progress}% · 重试 {job.retryCount}</span>
                </div>
              </li>
            ))}
          </ol>
        </aside>
      </section>

      <section className="document-library" aria-labelledby="document-library-title">
        <div className="document-library-heading">
          <div className="section-title">
            <FileText size={20} />
            <h2 id="document-library-title">已接入资料</h2>
          </div>
          {isAuthenticated ? <span>{documents.length} 份资料</span> : null}
        </div>

        {loading ? (
          <div className="document-skeleton" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        ) : documents.length > 0 ? (
          <div className="document-list">
            {documents.map((document) => (
              <article className="document-item" key={document.id}>
                <div>
                  <span>{documentTypeLabels[document.documentType]}</span>
                  <h3>{document.title}</h3>
                  <p>{document.contentPreview || "暂无预览"}</p>
                </div>
                <dl>
                  <div>
                    <dt>chunk</dt>
                    <dd>{document.chunkCount}</dd>
                  </div>
                  <div>
                    <dt>创建时间</dt>
                    <dd>{formatDateTime(document.createdAt)}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        ) : (
          <div className="document-empty">
            <FileText size={22} />
            <strong>{isAuthenticated ? "还没有资料" : "登录后查看资料库"}</strong>
            <span>
              {isAuthenticated
                ? "先提交一份简历或 JD，让后续题目生成和练习评分有个性化上下文。"
                : "资料库包含敏感内容，需要账号隔离后才能访问。"}
            </span>
          </div>
        )}
      </section>
    </main>
  );
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function toErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return `${error.message} (${error.status})`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "资料请求失败，请稍后重试。";
}
