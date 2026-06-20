"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/neon-button";

type AuthMode = "login" | "register" | "forgot";
type CharacterPosition = { faceX: number; faceY: number; bodySkew: number };
type CharacterPositions = Record<"purple" | "black" | "yellow" | "orange", CharacterPosition>;

const initialPositions: CharacterPositions = {
  purple: { faceX: 0, faceY: 0, bodySkew: 0 },
  black: { faceX: 0, faceY: 0, bodySkew: 0 },
  yellow: { faceX: 0, faceY: 0, bodySkew: 0 },
  orange: { faceX: 0, faceY: 0, bodySkew: 0 }
};

const copy = {
  login: {
    title: "欢迎回来！",
    subtitle: "请输入你的登录信息",
    action: "登录",
    switchText: "还没有账号？",
    switchHref: "/register",
    switchLink: "注册"
  },
  register: {
    title: "创建账号",
    subtitle: "开启你的面试训练室",
    action: "注册",
    switchText: "已经有账号？",
    switchHref: "/login",
    switchLink: "登录"
  },
  forgot: {
    title: "找回密码",
    subtitle: "输入邮箱继续",
    action: "发送找回邮件",
    switchText: "想起来了？",
    switchHref: "/login",
    switchLink: "返回登录"
  }
} satisfies Record<AuthMode, Record<string, string>>;

function useRandomBlink(setBlinking: (value: boolean) => void) {
  useEffect(() => {
    let blinkTimer: ReturnType<typeof setTimeout>;
    let openTimer: ReturnType<typeof setTimeout>;
    let mounted = true;

    function schedule() {
      blinkTimer = setTimeout(
        () => {
          if (!mounted) return;
          setBlinking(true);
          openTimer = setTimeout(() => {
            if (!mounted) return;
            setBlinking(false);
            schedule();
          }, 150);
        },
        Math.random() * 4000 + 3000
      );
    }

    schedule();

    return () => {
      mounted = false;
      clearTimeout(blinkTimer);
      clearTimeout(openTimer);
    };
  }, [setBlinking]);
}

function Pupil({
  size = 12,
  maxDistance = 5,
  forceLookX,
  forceLookY
}: {
  size?: number;
  maxDistance?: number;
  forceLookX?: number;
  forceLookY?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    function move(event: MouseEvent) {
      if (!ref.current) return;
      if (forceLookX !== undefined && forceLookY !== undefined) {
        setPosition({ x: forceLookX, y: forceLookY });
        return;
      }

      const rect = ref.current.getBoundingClientRect();
      const deltaX = event.clientX - (rect.left + rect.width / 2);
      const deltaY = event.clientY - (rect.top + rect.height / 2);
      const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);
      const angle = Math.atan2(deltaY, deltaX);
      setPosition({ x: Math.cos(angle) * distance, y: Math.sin(angle) * distance });
    }

    window.addEventListener("mousemove", move);
    if (forceLookX !== undefined && forceLookY !== undefined) {
      setPosition({ x: forceLookX, y: forceLookY });
    }

    return () => window.removeEventListener("mousemove", move);
  }, [forceLookX, forceLookY, maxDistance]);

  return (
    <span
      className="animated-pupil"
      ref={ref}
      style={{
        width: size,
        height: size,
        transform: `translate(${position.x}px, ${position.y}px)`
      }}
    />
  );
}

function EyeBall({
  size,
  pupilSize,
  maxDistance,
  isBlinking,
  forceLookX,
  forceLookY
}: {
  size: number;
  pupilSize: number;
  maxDistance: number;
  isBlinking: boolean;
  forceLookX?: number;
  forceLookY?: number;
}) {
  return (
    <span
      className="animated-eye"
      style={{
        width: size,
        height: isBlinking ? 2 : size
      }}
    >
      {!isBlinking ? (
        <Pupil
          forceLookX={forceLookX}
          forceLookY={forceLookY}
          maxDistance={maxDistance}
          size={pupilSize}
        />
      ) : null}
    </span>
  );
}

function SparklesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L15 9H9L12 2Z" />
      <path d="M12 22L9 15H15L12 22Z" />
      <path d="M2 12L9 9V15L2 12Z" />
      <path d="M22 12L15 15V9L22 12Z" />
    </svg>
  );
}

function EyeIcon({ off = false }: { off?: boolean }) {
  return off ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg className="btn__icon" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 1 12c0 1.94.46 3.77 1.18 5.07l3.66-2.84v-.14z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function AnimatedLoginCard({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const requiresPassword = mode !== "forgot";
  const current = copy[mode];
  const purpleRef = useRef<HTMLDivElement>(null);
  const blackRef = useRef<HTMLDivElement>(null);
  const yellowRef = useRef<HTMLDivElement>(null);
  const orangeRef = useRef<HTMLDivElement>(null);
  const recoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
  const [isBlackBlinking, setIsBlackBlinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
  const [isPurplePeeking, setIsPurplePeeking] = useState(false);
  const [isLoginError, setIsLoginError] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [positions, setPositions] = useState<CharacterPositions>(initialPositions);

  useRandomBlink(setIsPurpleBlinking);
  useRandomBlink(setIsBlackBlinking);

  useEffect(() => {
    function calculate(ref: React.RefObject<HTMLDivElement | null>, event: MouseEvent) {
      if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };
      const rect = ref.current.getBoundingClientRect();
      const deltaX = event.clientX - (rect.left + rect.width / 2);
      const deltaY = event.clientY - (rect.top + rect.height / 3);
      return {
        faceX: Math.max(-15, Math.min(15, deltaX / 20)),
        faceY: Math.max(-10, Math.min(10, deltaY / 30)),
        bodySkew: Math.max(-6, Math.min(6, -deltaX / 120))
      };
    }

    function move(event: MouseEvent) {
      if (isLoginError) return;
      setPositions({
        purple: calculate(purpleRef, event),
        black: calculate(blackRef, event),
        yellow: calculate(yellowRef, event),
        orange: calculate(orangeRef, event)
      });
    }

    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [isLoginError]);

  useEffect(() => {
    if (!isTyping) {
      setIsLookingAtEachOther(false);
      return;
    }

    setIsLookingAtEachOther(true);
    const timer = setTimeout(() => setIsLookingAtEachOther(false), 800);
    return () => clearTimeout(timer);
  }, [isTyping, email]);

  useEffect(() => {
    if (!password || !showPassword) {
      setIsPurplePeeking(false);
      return;
    }

    let mounted = true;
    let timer: ReturnType<typeof setTimeout>;
    function schedule() {
      timer = setTimeout(
        () => {
          if (!mounted) return;
          setIsPurplePeeking(true);
          setTimeout(() => {
            if (!mounted) return;
            setIsPurplePeeking(false);
            schedule();
          }, 800);
        },
        Math.random() * 3000 + 2000
      );
    }
    schedule();

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [password, showPassword]);

  useEffect(() => {
    return () => {
      if (recoverTimerRef.current) clearTimeout(recoverTimerRef.current);
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    };
  }, []);

  function triggerLoginError() {
    if (recoverTimerRef.current) clearTimeout(recoverTimerRef.current);
    if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);

    setIsLoginError(true);
    setIsPasswordFocused(false);
    setIsShaking(false);
    shakeTimerRef.current = setTimeout(() => setIsShaking(true), 350);

    recoverTimerRef.current = setTimeout(() => {
      setIsLoginError(false);
      setIsShaking(false);
    }, 2500);
  }

  function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);
    setTimeout(() => router.push(mode === "forgot" ? "/login" : "/dashboard"), 300);
  }

  const isShowingPassword = requiresPassword && password.length > 0 && showPassword;
  const isLookingAway = requiresPassword && isPasswordFocused && !showPassword;
  const shakeClass = isShaking ? " shake-head" : "";
  const purplePos = positions.purple;
  const blackPos = positions.black;
  const yellowPos = positions.yellow;
  const orangePos = positions.orange;

  return (
    // Based on guohaolian/animatedlogin (MIT), adapted for this Next.js prototype.
    <main className="login-page">
      <section className="login-panel" aria-label="训练搭档">
        <div className="login-panel__header">
          <div className="login-panel__brand">
            <span className="login-panel__brand-icon">
              <SparklesIcon />
            </span>
            <span>面试雷达</span>
          </div>
        </div>

        <div className="login-panel__characters" aria-hidden="true">
          <div className="character-stage">
            <div
              className="character"
              ref={purpleRef}
              style={{
                left: 70,
                width: 180,
                height: isTyping || isLookingAway ? 440 : 400,
                backgroundColor: "#6C3FF5",
                borderRadius: "10px 10px 0 0",
                zIndex: 1,
                transform: isShowingPassword
                  ? "skewX(0deg)"
                  : isLookingAway
                    ? "skewX(-14deg) translateX(-20px)"
                    : isTyping
                      ? `skewX(${purplePos.bodySkew - 12}deg) translateX(40px)`
                      : `skewX(${purplePos.bodySkew}deg)`,
                transformOrigin: "bottom center"
              }}
            >
              <span
                className={`character__eyes flex gap-8${shakeClass}`}
                style={{
                  left: isLoginError
                    ? 30
                    : isLookingAway
                      ? 20
                      : isShowingPassword
                        ? 20
                        : isLookingAtEachOther
                          ? 55
                          : 45 + purplePos.faceX,
                  top: isLoginError
                    ? 55
                    : isLookingAway
                      ? 25
                      : isShowingPassword
                        ? 35
                        : isLookingAtEachOther
                          ? 65
                          : 40 + purplePos.faceY
                }}
              >
                <EyeBall
                  forceLookX={
                    isLoginError ? -3 : isLookingAway ? -5 : isShowingPassword ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined
                  }
                  forceLookY={
                    isLoginError ? 4 : isLookingAway ? -5 : isShowingPassword ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined
                  }
                  isBlinking={isPurpleBlinking}
                  maxDistance={5}
                  pupilSize={7}
                  size={18}
                />
                <EyeBall
                  forceLookX={
                    isLoginError ? -3 : isLookingAway ? -5 : isShowingPassword ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined
                  }
                  forceLookY={
                    isLoginError ? 4 : isLookingAway ? -5 : isShowingPassword ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined
                  }
                  isBlinking={isPurpleBlinking}
                  maxDistance={5}
                  pupilSize={7}
                  size={18}
                />
              </span>
            </div>

            <div
              className="character"
              ref={blackRef}
              style={{
                left: 240,
                width: 120,
                height: 310,
                backgroundColor: "#2D2D2D",
                borderRadius: "8px 8px 0 0",
                zIndex: 2,
                transform: isShowingPassword
                  ? "skewX(0deg)"
                  : isLookingAway
                    ? "skewX(12deg) translateX(-10px)"
                    : isLookingAtEachOther
                      ? `skewX(${blackPos.bodySkew * 1.5 + 10}deg) translateX(20px)`
                      : isTyping
                        ? `skewX(${blackPos.bodySkew * 1.5}deg)`
                        : `skewX(${blackPos.bodySkew}deg)`,
                transformOrigin: "bottom center"
              }}
            >
              <span
                className={`character__eyes flex gap-6${shakeClass}`}
                style={{
                  left: isLoginError
                    ? 15
                    : isLookingAway
                      ? 10
                      : isShowingPassword
                        ? 10
                        : isLookingAtEachOther
                          ? 32
                          : 26 + blackPos.faceX,
                  top: isLoginError
                    ? 40
                    : isLookingAway
                      ? 20
                      : isShowingPassword
                        ? 28
                        : isLookingAtEachOther
                          ? 12
                          : 32 + blackPos.faceY
                }}
              >
                <EyeBall
                  forceLookX={isLoginError ? -3 : isLookingAway ? -4 : isShowingPassword ? -4 : isLookingAtEachOther ? 0 : undefined}
                  forceLookY={isLoginError ? 4 : isLookingAway ? -5 : isShowingPassword ? -4 : isLookingAtEachOther ? -4 : undefined}
                  isBlinking={isBlackBlinking}
                  maxDistance={4}
                  pupilSize={6}
                  size={16}
                />
                <EyeBall
                  forceLookX={isLoginError ? -3 : isLookingAway ? -4 : isShowingPassword ? -4 : isLookingAtEachOther ? 0 : undefined}
                  forceLookY={isLoginError ? 4 : isLookingAway ? -5 : isShowingPassword ? -4 : isLookingAtEachOther ? -4 : undefined}
                  isBlinking={isBlackBlinking}
                  maxDistance={4}
                  pupilSize={6}
                  size={16}
                />
              </span>
            </div>

            <div
              className="character"
              ref={orangeRef}
              style={{
                left: 0,
                width: 240,
                height: 200,
                zIndex: 3,
                backgroundColor: "#FF9B6B",
                borderRadius: "120px 120px 0 0",
                transform: isShowingPassword ? "skewX(0deg)" : `skewX(${orangePos.bodySkew}deg)`,
                transformOrigin: "bottom center"
              }}
            >
              <span
                className={`character__eyes character__eyes--fast flex gap-8${shakeClass}`}
                style={{
                  left: isLoginError ? 60 : isLookingAway ? 50 : isShowingPassword ? 50 : 82 + orangePos.faceX,
                  top: isLoginError ? 95 : isLookingAway ? 75 : isShowingPassword ? 85 : 90 + orangePos.faceY
                }}
              >
                <Pupil forceLookX={isLoginError ? -3 : isLookingAway || isShowingPassword ? -5 : undefined} forceLookY={isLoginError ? 4 : isLookingAway ? -5 : isShowingPassword ? -4 : undefined} />
                <Pupil forceLookX={isLoginError ? -3 : isLookingAway || isShowingPassword ? -5 : undefined} forceLookY={isLoginError ? 4 : isLookingAway ? -5 : isShowingPassword ? -4 : undefined} />
              </span>
              <span
                className={`orange-mouth${isLoginError ? " visible" : ""}${shakeClass}`}
                style={{
                  left: 80 + orangePos.faceX,
                  top: 130
                }}
              />
            </div>

            <div
              className="character"
              ref={yellowRef}
              style={{
                left: 310,
                width: 140,
                height: 230,
                backgroundColor: "#E8D754",
                borderRadius: "70px 70px 0 0",
                zIndex: 4,
                transform: isShowingPassword ? "skewX(0deg)" : `skewX(${yellowPos.bodySkew}deg)`,
                transformOrigin: "bottom center"
              }}
            >
              <span
                className={`character__eyes character__eyes--fast flex gap-6${shakeClass}`}
                style={{
                  left: isLoginError ? 35 : isLookingAway ? 20 : isShowingPassword ? 20 : 52 + yellowPos.faceX,
                  top: isLoginError ? 45 : isLookingAway ? 30 : isShowingPassword ? 35 : 40 + yellowPos.faceY
                }}
              >
                <Pupil forceLookX={isLoginError ? -3 : isLookingAway || isShowingPassword ? -5 : undefined} forceLookY={isLoginError ? 4 : isLookingAway ? -5 : isShowingPassword ? -4 : undefined} />
                <Pupil forceLookX={isLoginError ? -3 : isLookingAway || isShowingPassword ? -5 : undefined} forceLookY={isLoginError ? 4 : isLookingAway ? -5 : isShowingPassword ? -4 : undefined} />
              </span>
              <span
                className={`character__mouth${shakeClass}`}
                style={{
                  left: isLoginError ? 30 : isLookingAway ? 15 : isShowingPassword ? 10 : 40 + yellowPos.faceX,
                  top: isLoginError ? 92 : isLookingAway ? 78 : isShowingPassword ? 88 : 88 + yellowPos.faceY,
                  transform: isLoginError ? "rotate(-8deg)" : "rotate(0deg)"
                }}
              />
            </div>
          </div>
        </div>

        <span className="login-panel__grid" />
        <span className="login-panel__blur-top" />
        <span className="login-panel__blur-bottom" />
      </section>

      <section className="login-form-section" aria-label={current.title}>
        <div className="login-form-container">
          <div className="login-form__mobile-brand">
            <span className="login-form__mobile-brand-icon">
              <SparklesIcon />
            </span>
            <span>面试雷达</span>
          </div>

          <div className="login-form__header">
            <h1 className="login-form__title">{current.title}</h1>
            <p className="login-form__subtitle">{current.subtitle}</p>
          </div>

          <form className="login-form" noValidate onSubmit={submitAuth}>
            {mode === "register" ? (
              <label className="form-field">
                <span className="label">用户名</span>
                <input
                  autoComplete="username"
                  className="input input--lg input--soft-border"
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="输入你的用户名"
                  type="text"
                  value={username}
                />
              </label>
            ) : null}

            <label className="form-field">
              <span className="label">邮箱</span>
              <input
                autoComplete="off"
                className="input input--lg input--soft-border"
                onBlur={() => setIsTyping(false)}
                onChange={(event) => setEmail(event.target.value)}
                onFocus={() => setIsTyping(true)}
                placeholder="anna@gmail.com"
                type="email"
                value={email}
              />
            </label>

            {mode === "register" ? (
              <label className="form-field">
                <span className="label">邮箱验证码</span>
                <span className="verification-field">
                  <input
                    autoComplete="one-time-code"
                    className="input input--lg input--soft-border"
                    inputMode="numeric"
                    onChange={(event) => setEmailCode(event.target.value)}
                    placeholder="输入 6 位验证码"
                    type="text"
                    value={emailCode}
                  />
                  <Button
                    className="verification-button"
                    neon={false}
                    onClick={() => setIsCodeSent(true)}
                    size="lg"
                    type="button"
                    variant="default"
                  >
                    {isCodeSent ? "已发送" : "获取验证码"}
                  </Button>
                </span>
              </label>
            ) : null}

            {requiresPassword ? (
              <label className="form-field">
                <span className="label">密码</span>
                <span className="form-field__control">
                  <input
                    autoComplete={mode === "register" ? "new-password" : "current-password"}
                    className="input input--lg input--with-icon input--soft-border"
                    onBlur={() => setIsPasswordFocused(false)}
                    onChange={(event) => setPassword(event.target.value)}
                    onFocus={() => setIsPasswordFocused(true)}
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    value={password}
                  />
                  <button
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="password-toggle"
                    onClick={() => setShowPassword((value) => !value)}
                    type="button"
                  >
                    <EyeIcon off={showPassword} />
                  </button>
                </span>
              </label>
            ) : null}

            {mode === "register" ? (
              <label className="form-field">
                <span className="label">重复密码</span>
                <input
                  autoComplete="new-password"
                  className="input input--lg input--soft-border"
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="再次输入密码"
                  type="password"
                  value={confirmPassword}
                />
              </label>
            ) : null}

            {mode === "login" ? (
              <div className="form-row">
                <label className="form-row__checkbox">
                  <input className="checkbox" defaultChecked type="checkbox" />
                  <span className="label label--normal label--clickable">记住 30 天</span>
                </label>
                <Link className="form-link" href="/forgot-password">
                  找回密码
                </Link>
              </div>
            ) : null}

            {error ? <div className="form-error">{error}</div> : null}

            <Button className="auth-action-button" disabled={isLoading} size="lg" type="submit" variant="solid">
              {isLoading ? "处理中..." : current.action}
            </Button>
          </form>

          {mode === "login" ? (
            <div className="social-login">
              <Button className="auth-action-button" neon={false} size="lg" type="button">
                <GoogleIcon />
                使用 Google 登录
              </Button>
            </div>
          ) : null}

          <p className="signup-link">
            {current.switchText} <Link href={current.switchHref}>{current.switchLink}</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
