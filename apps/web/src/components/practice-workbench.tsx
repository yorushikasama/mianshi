"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { AiJob, Answer, PracticeAttemptResult, PracticeReviewState, Question } from "@mianshi/shared";
import { AlertCircle, ArrowLeft, BookOpen, CheckCircle2, Gauge, Loader2, LogIn, RotateCcw, Send } from "lucide-react";
import { useAuth } from "./auth-provider";
import {
  ApiError,
  buildGenerateAnswerJobInput,
  buildGenerateFollowupJobInput,
  createAiJob,
  fetchQuestion,
  fetchQuestionAnswer,
  fetchPracticeAttempts,
  fetchPracticeReviewState,
  fetchJavaBackendAnswer,
  fetchJavaBackendQuestion,
  submitPracticeAttempt,
} from "@/lib/api";

interface PracticeWorkbenchProps {
  questionId: string;
}

export function PracticeWorkbench({ questionId }: PracticeWorkbenchProps) {
  const { status, user } = useAuth();
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [attempts, setAttempts] = useState<PracticeAttemptResult[]>([]);
  const [reviewState, setReviewState] = useState<PracticeReviewState | null>(null);
  const [submittedAnswer, setSubmittedAnswer] = useState("");
  const [result, setResult] = useState<PracticeAttemptResult | null>(null);
  const [answerJob, setAnswerJob] = useState<AiJob | null>(null);
  const [followupJob, setFollowupJob] = useState<AiJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [generatingAnswer, setGeneratingAnswer] = useState(false);
  const [generatingFollowup, setGeneratingFollowup] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadQuestion() {
      setLoading(true);
      setError(null);
      setAnswerJob(null);
      setFollowupJob(null);

      try {
        const [loadedQuestion, loadedAnswer] = await Promise.all([
          loadVisibleQuestion(questionId, status === "authenticated"),
          loadVisibleAnswer(questionId, status === "authenticated"),
        ]);
        const [loadedAttempts, loadedReviewState] =
          status === "authenticated"
            ? await Promise.all([fetchPracticeAttempts(questionId), fetchPracticeReviewState(questionId)])
            : [[], null];

        if (active) {
          setQuestion(loadedQuestion);
          setAnswer(loadedAnswer);
          setAttempts(loadedAttempts);
          setReviewState(loadedReviewState);
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
      void loadQuestion();
    }

    return () => {
      active = false;
    };
  }, [questionId, status]);

  const isAuthenticated = status === "authenticated" && Boolean(user);
  const canSubmit = isAuthenticated && Boolean(answer) && submittedAnswer.trim().length >= 4 && !submitting;
  const coverageText = useMemo(() => {
    if (!result || !answer) {
      return "提交后生成";
    }

    return `${result.matchedKeyPoints.length}/${answer.keyPoints.length}`;
  }, [answer, result]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isAuthenticated) {
      setError("请先登录，再提交练习回答。");
      return;
    }

    if (!canSubmit) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const attempt = await submitPracticeAttempt({
        questionId,
        submittedAnswer,
      });
      setResult(attempt);
      setFollowupJob(null);
      setAttempts((currentAttempts) => {
        const nextAttempts = [attempt, ...currentAttempts];
        setReviewState({
          questionId,
          attemptCount: nextAttempts.length,
          lastAttemptId: attempt.id,
          lastScore: attempt.score,
          rating: attempt.rating,
          lastPracticedAt: attempt.createdAt,
          nextReviewAt: attempt.nextReviewAt,
        });
        return nextAttempts;
      });
    } catch (submitError) {
      setError(toErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGenerateAnswer() {
    if (!isAuthenticated) {
      setError("请先登录，再生成答案。");
      return;
    }

    setGeneratingAnswer(true);
    setError(null);

    try {
      const job = await createAiJob({
        type: "generate_answer",
        input: buildGenerateAnswerJobInput(questionId),
      });
      setAnswerJob(job);
    } catch (generateError) {
      setError(toErrorMessage(generateError));
    } finally {
      setGeneratingAnswer(false);
    }
  }

  async function handleGenerateFollowup() {
    if (!isAuthenticated || !result) {
      setError("请先提交练习回答，再生成追问。");
      return;
    }

    setGeneratingFollowup(true);
    setError(null);

    try {
      const job = await createAiJob({
        type: "generate_followup",
        input: buildGenerateFollowupJobInput(result.id, 3),
      });
      setFollowupJob(job);
    } catch (generateError) {
      setError(toErrorMessage(generateError));
    } finally {
      setGeneratingFollowup(false);
    }
  }

  if (loading) {
    return (
      <main className="practice-page">
        <div className="practice-loading">正在加载练习题...</div>
      </main>
    );
  }

  if (!question) {
    return (
      <main className="practice-page">
        <a className="back-link" href="/">
          <ArrowLeft size={17} />
          返回工作台
        </a>
        <div className="practice-error">
          <AlertCircle size={22} />
          <span>{error ?? "题目加载失败"}</span>
        </div>
      </main>
    );
  }

  return (
    <main className="practice-page">
      <header className="practice-header">
        <a className="back-link" href="/">
          <ArrowLeft size={17} />
          返回工作台
        </a>
        <div>
          <p className="eyebrow">主动复述 · AI 评分草稿</p>
          <h1>{question.title}</h1>
          <p>{question.content}</p>
        </div>
      </header>

      {error ? (
        <div className="practice-error" role="alert">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      ) : null}

      {isAuthenticated && !answer ? (
        <div className="practice-auth-callout" role="status">
          <BookOpen size={20} />
          <div>
            <strong>这道题还没有答案版本</strong>
            <span>
              {answerJob
                ? `答案生成任务已入队：${answerJob.status}。稍后刷新题目即可练习评分。`
                : "先通过 AI job 生成答案，再提交评分。题目内容仍可用于自测和准备口头回答。"}
            </span>
          </div>
          <button type="button" disabled={generatingAnswer || Boolean(answerJob)} onClick={handleGenerateAnswer}>
            {generatingAnswer ? <Loader2 className="spin-icon" size={17} /> : <BookOpen size={17} />}
            {answerJob ? "已入队" : generatingAnswer ? "生成中" : "生成答案"}
          </button>
        </div>
      ) : null}

      {!isAuthenticated ? (
        <div className="practice-auth-callout" role="status">
          <LogIn size={20} />
          <div>
            <strong>登录后记录练习结果</strong>
            <span>题目可以先看，提交评分、历史记录和复习状态需要账号隔离。</span>
          </div>
          <a href="/auth">登录 / 注册</a>
        </div>
      ) : null}

      <section className="practice-layout">
        <form className="question-panel" onSubmit={handleSubmit}>
          <div className="practice-meta">
            <span>{question.difficulty}</span>
            <span>{question.type}</span>
            {question.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>

          <label htmlFor="practice-answer">先不要看答案，用面试口吻完整复述</label>
          <textarea
            id="practice-answer"
            className="answer-input"
            value={submittedAnswer}
            onChange={(event) => setSubmittedAnswer(event.target.value)}
            placeholder="例如：我会先说明概念，再结合线上场景、风险和取舍来回答..."
          />

          <div className="practice-actions">
            <button type="submit" disabled={!canSubmit}>
              <Send size={17} />
              {!isAuthenticated ? "登录后提交" : !answer ? "等待答案" : submitting ? "评分中..." : "提交评分"}
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                setSubmittedAnswer("");
                setResult(null);
                setFollowupJob(null);
              }}
            >
              <RotateCcw size={17} />
              重练
            </button>
          </div>
        </form>

        <aside className="answer-panel">
          <div className="score-card">
            <Gauge size={20} />
            <span>关键点覆盖</span>
            <strong>{coverageText}</strong>
          </div>

          <div className="review-card">
            <h2>复习状态</h2>
            <dl>
              <div>
                <dt>练习次数</dt>
                <dd>{reviewState?.attemptCount ?? 0}</dd>
              </div>
              <div>
                <dt>最近分数</dt>
                <dd>{reviewState?.lastScore ?? "--"}</dd>
              </div>
              <div>
                <dt>下次复习</dt>
                <dd>{formatDateTime(reviewState?.nextReviewAt)}</dd>
              </div>
            </dl>
          </div>

          {attempts.length > 0 ? (
            <div className="history-card">
              <h2>最近记录</h2>
              <ol>
                {attempts.slice(0, 3).map((attempt) => (
                  <li key={attempt.id}>
                    <span>{attempt.score} 分 · {attempt.rating}</span>
                    <time>{formatDateTime(attempt.createdAt)}</time>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {result && answer ? (
            <div className="result-panel">
              <div className="result-score">
                <strong>{result.score}</strong>
                <span>FSRS: {result.rating}</span>
              </div>
              <p>{result.feedbackSummary}</p>

              <div className="followup-card">
                <div>
                  <h2>面试追问</h2>
                  <p>
                    {followupJob
                      ? `追问生成任务已入队：${followupJob.status}。稍后刷新即可查看更新后的追问。`
                      : "基于这次回答和遗漏点，继续模拟面试官的后续追问。"}
                  </p>
                </div>
                <button type="button" disabled={generatingFollowup || Boolean(followupJob)} onClick={handleGenerateFollowup}>
                  {generatingFollowup ? <Loader2 className="spin-icon" size={16} /> : <BookOpen size={16} />}
                  {followupJob ? "已入队" : generatingFollowup ? "生成中" : "生成追问"}
                </button>
              </div>

              {result.followUpQuestions.length > 0 ? (
                <>
                  <h2>已有追问</h2>
                  <ul>
                    {result.followUpQuestions.map((question) => (
                      <li key={question}>
                        <AlertCircle size={16} />
                        {question}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}

              <h2>已覆盖</h2>
              <ul>
                {result.matchedKeyPoints.map((point) => (
                  <li key={point}>
                    <CheckCircle2 size={16} />
                    {point}
                  </li>
                ))}
              </ul>

              <h2>需要补充</h2>
              <ul>
                {result.missingKeyPoints.length > 0 ? (
                  result.missingKeyPoints.map((point) => (
                    <li key={point}>
                      <AlertCircle size={16} />
                      {point}
                    </li>
                  ))
                ) : (
                  <li>
                    <CheckCircle2 size={16} />
                    这道题的关键点已经覆盖完整
                  </li>
                )}
              </ul>

              <h2>标准答案</h2>
              <p>{answer.content}</p>
            </div>
          ) : (
            <div className="answer-locked">
              <BookOpen size={22} />
              <h2>答案会在提交后显示</h2>
              <p>这个页面先训练主动回忆，再给你分数、遗漏点和下一次复习安排。</p>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}

async function loadVisibleQuestion(questionId: string, isAuthenticated: boolean) {
  if (!isAuthenticated) {
    return fetchJavaBackendQuestion(questionId);
  }

  try {
    return await fetchQuestion(questionId);
  } catch {
    return fetchJavaBackendQuestion(questionId);
  }
}

async function loadVisibleAnswer(questionId: string, isAuthenticated: boolean) {
  if (!isAuthenticated) {
    return fetchJavaBackendAnswer(questionId);
  }

  try {
    return await fetchQuestionAnswer(questionId);
  } catch {
    try {
      return await fetchJavaBackendAnswer(questionId);
    } catch {
      return null;
    }
  }
}

function formatDateTime(value?: string) {
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

  return "请求失败，请稍后重试。";
}
