"use client";

import { FormEvent, useState } from "react";
import { ArrowLeft, LogIn, Radar, UserPlus } from "lucide-react";
import { ApiError } from "@/lib/api";
import { useAuth } from "./auth-provider";

type AuthMode = "login" | "register";

export function AuthPanel() {
  const { signIn, signUp, status, user } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (mode === "login") {
        await signIn({ email, password });
      } else {
        await signUp({ email, password, displayName: displayName || undefined });
      }
    } catch (authError) {
      setError(toErrorMessage(authError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <a className="back-link" href="/">
        <ArrowLeft size={17} />
        返回工作台
      </a>

      <section className="auth-shell" aria-labelledby="auth-title">
        <div className="auth-copy">
          <span className="brand-mark">
            <Radar size={22} strokeWidth={2.3} />
          </span>
          <p className="eyebrow">账号会关联你的题库、练习记录和复习状态</p>
          <h1 id="auth-title">登录后开始记录真实复习轨迹</h1>
          <p>
            面试雷达会把练习回答、评分结果和下次复习时间绑定到你的账号。后续上传简历、JD 和项目笔记时，也会按用户隔离检索。
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-tabs" role="tablist" aria-label="认证模式">
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
              <LogIn size={16} />
              登录
            </button>
            <button
              type="button"
              className={mode === "register" ? "active" : ""}
              onClick={() => setMode("register")}
            >
              <UserPlus size={16} />
              注册
            </button>
          </div>

          {status === "authenticated" && user ? (
            <div className="auth-success">
              <strong>{user.displayName ?? user.email}</strong>
              <span>已登录，可以返回练习页面继续提交回答。</span>
            </div>
          ) : null}

          {mode === "register" ? (
            <label>
              昵称
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="例如：Java 后端候选人"
                autoComplete="nickname"
              />
            </label>
          ) : null}

          <label>
            邮箱
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              type="email"
              autoComplete="email"
              required
            />
          </label>

          <label>
            密码
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="至少 12 位"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={12}
              required
            />
          </label>

          {error ? (
            <div className="auth-error" role="alert">
              {error}
            </div>
          ) : null}

          <button className="auth-submit" type="submit" disabled={submitting}>
            {mode === "login" ? <LogIn size={17} /> : <UserPlus size={17} />}
            {submitting ? "处理中..." : mode === "login" ? "登录" : "创建账号"}
          </button>

          <a className="auth-secondary" href="/practice/q_jvm_gc_roots">
            去练习 GC Roots
          </a>
        </form>
      </section>
    </main>
  );
}

function toErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return `${error.message} (${error.status})`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "认证请求失败，请稍后重试。";
}
