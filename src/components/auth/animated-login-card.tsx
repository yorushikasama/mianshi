"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/shiny-button";
import { authClient } from "@/lib/auth-client";

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
    subtitle: "使用用户名或邮箱登录",
    action: "登录",
    switchText: "还没有账号？",
    switchHref: "/register",
    switchLink: "注册"
  },
  register: {
    title: "创建一个账户",
    subtitle: "开启你的面试训练室",
    action: "注册",
    switchText: "已有账号？",
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
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L15 9H9L12 2Z" />
      <path d="M12 22L9 15H15L12 22Z" />
      <path d="M2 12L9 9V15L2 12Z" />
      <path d="M22 12L15 15V9L22 12Z" />
    </svg>
  );
}

function EyeIcon({ off = false }: { off?: boolean }) {
  return off ? (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
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

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
  const [isBlackBlinking, setIsBlackBlinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
  const [isPurplePeeking, setIsPurplePeeking] = useState(false);
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
      setPositions({
        purple: calculate(purpleRef, event),
        black: calculate(blackRef, event),
        yellow: calculate(yellowRef, event),
        orange: calculate(orangeRef, event)
      });
    }

    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

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

  async function sendRegisterCode() {
    if (mode === "register" && password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return false;
    }

    setIsLoading(true);
    const result = isCodeSent
      ? await authClient.emailOtp.sendVerificationOtp({ email, type: "email-verification" })
      : await authClient.signUp.email({ email, password, name: username || email, username });

    if (result.error) {
      setError(result.error.message || "操作失败，请稍后重试");
      setIsLoading(false);
      return false;
    }

    setIsCodeSent(true);
    setMessage("验证码已发送，请查看邮箱");
    setIsLoading(false);
    return true;
  }

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (mode === "register") {
      if (!isCodeSent) {
        await sendRegisterCode();
        return;
      }

      if (!emailCode.trim()) {
        setError("请输入邮箱验证码");
        return;
      }

      setIsLoading(true);
      const result = await authClient.emailOtp.verifyEmail({ email, otp: emailCode.trim() });
      if (result.error) {
        setError(result.error.message || "验证码校验失败");
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
      return;
    }

    setIsLoading(true);
    const loginId = identifier.trim();
    const result = mode === "login"
      ? loginId.includes("@")
        ? await authClient.signIn.email({ email: loginId, password })
        : await authClient.signIn.username({ username: loginId, password })
      : await authClient.requestPasswordReset({
          email,
          redirectTo: `${window.location.origin}/login`
        });

    if (result.error) {
      setError(result.error.message || "操作失败，请稍后重试");
      setIsLoading(false);
      return;
    }

    router.push(mode === "forgot" ? "/login" : "/dashboard");
  }

  const isShowingPassword = requiresPassword && password.length > 0 && showPassword;
  const isHidingPassword = requiresPassword && (isPasswordFocused || password.length > 0) && !showPassword;
  const purplePos = positions.purple;
  const blackPos = positions.black;
  const yellowPos = positions.yellow;
  const orangePos = positions.orange;

  return (
    // Based on guohaolian/animatedlogin (MIT), adapted for this Next.js prototype.
    <main className="grid min-h-dvh overflow-hidden bg-white text-[#020817] lg:grid-cols-2 max-lg:overflow-auto">
      <section className="relative isolate hidden h-dvh min-h-0 flex-col justify-between overflow-hidden bg-[#17151f] p-12 text-white lg:flex" aria-label="训练搭档">
        <div className="relative z-20">
          <div className="inline-flex items-center gap-3 text-base font-black">
            <span className="inline-grid h-10 w-10 place-items-center rounded-2xl bg-white text-[#17151f]">
              <SparklesIcon />
            </span>
            <span>面试雷达</span>
          </div>
        </div>

        <div className="relative z-20 flex h-[500px] min-h-0 items-end justify-center overflow-hidden" aria-hidden="true">
          <div className="character-stage origin-bottom scale-[0.82] min-[1180px]:scale-100">
            <div
              className="character"
              ref={purpleRef}
              style={{
                left: 70,
                width: 180,
                height: isTyping || isHidingPassword ? 440 : 400,
                backgroundColor: "#6C3FF5",
                borderRadius: "10px 10px 0 0",
                zIndex: 1,
                transform: isShowingPassword
                  ? "skewX(0deg)"
                  : isHidingPassword
                    ? "skewX(-14deg) translateX(-20px)"
                    : isTyping
                    ? `skewX(${purplePos.bodySkew - 12}deg) translateX(40px)`
                    : `skewX(${purplePos.bodySkew}deg)`,
                transformOrigin: "bottom center"
              }}
            >
              <span
                className="character__eyes flex gap-8"
                style={{
                  left: isShowingPassword ? 20 : isLookingAtEachOther ? 55 : 45 + purplePos.faceX,
                  top: isHidingPassword ? 25 : isShowingPassword ? 35 : isLookingAtEachOther ? 65 : 40 + purplePos.faceY
                }}
              >
                <EyeBall
                  forceLookX={
                    isHidingPassword ? -5 : isShowingPassword ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined
                  }
                  forceLookY={
                    isHidingPassword ? -5 : isShowingPassword ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined
                  }
                  isBlinking={isPurpleBlinking}
                  maxDistance={5}
                  pupilSize={7}
                  size={18}
                />
                <EyeBall
                  forceLookX={
                    isHidingPassword ? -5 : isShowingPassword ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined
                  }
                  forceLookY={
                    isHidingPassword ? -5 : isShowingPassword ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined
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
                  : isHidingPassword
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
                className="character__eyes flex gap-6"
                style={{
                  left: isHidingPassword ? 10 : isShowingPassword ? 10 : isLookingAtEachOther ? 32 : 26 + blackPos.faceX,
                  top: isHidingPassword ? 20 : isShowingPassword ? 28 : isLookingAtEachOther ? 12 : 32 + blackPos.faceY
                }}
              >
                <EyeBall
                  forceLookX={isHidingPassword ? -4 : isShowingPassword ? -4 : isLookingAtEachOther ? 0 : undefined}
                  forceLookY={isHidingPassword ? -5 : isShowingPassword ? -4 : isLookingAtEachOther ? -4 : undefined}
                  isBlinking={isBlackBlinking}
                  maxDistance={4}
                  pupilSize={6}
                  size={16}
                />
                <EyeBall
                  forceLookX={isHidingPassword ? -4 : isShowingPassword ? -4 : isLookingAtEachOther ? 0 : undefined}
                  forceLookY={isHidingPassword ? -5 : isShowingPassword ? -4 : isLookingAtEachOther ? -4 : undefined}
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
                className="character__eyes character__eyes--fast flex gap-8"
                style={{
                  left: isHidingPassword ? 50 : isShowingPassword ? 50 : 82 + orangePos.faceX,
                  top: isHidingPassword ? 75 : isShowingPassword ? 85 : 90 + orangePos.faceY
                }}
              >
                <Pupil forceLookX={isHidingPassword || isShowingPassword ? -5 : undefined} forceLookY={isHidingPassword ? -5 : isShowingPassword ? -4 : undefined} />
                <Pupil forceLookX={isHidingPassword || isShowingPassword ? -5 : undefined} forceLookY={isHidingPassword ? -5 : isShowingPassword ? -4 : undefined} />
              </span>
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
                className="character__eyes character__eyes--fast flex gap-6"
                style={{
                  left: isHidingPassword ? 20 : isShowingPassword ? 20 : 52 + yellowPos.faceX,
                  top: isHidingPassword ? 30 : isShowingPassword ? 35 : 40 + yellowPos.faceY
                }}
              >
                <Pupil forceLookX={isHidingPassword || isShowingPassword ? -5 : undefined} forceLookY={isHidingPassword ? -5 : isShowingPassword ? -4 : undefined} />
                <Pupil forceLookX={isHidingPassword || isShowingPassword ? -5 : undefined} forceLookY={isHidingPassword ? -5 : isShowingPassword ? -4 : undefined} />
              </span>
              <span
                className="character__mouth"
                style={{
                  left: isHidingPassword ? 15 : isShowingPassword ? 10 : 40 + yellowPos.faceX,
                  top: isHidingPassword ? 78 : isShowingPassword ? 88 : 88 + yellowPos.faceY
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="flex h-dvh min-h-0 items-center justify-center overflow-auto bg-white px-8 py-6 max-sm:px-5" aria-label={current.title}>
        <div className="w-full max-w-[420px]">
          <div className="mb-8 hidden items-center justify-center gap-3 font-black max-lg:flex">
            <span className="inline-grid h-10 w-10 place-items-center rounded-2xl bg-[#17151f] text-white">
              <SparklesIcon />
            </span>
            <span>面试雷达</span>
          </div>

          <div className={`${mode === "register" ? "mb-8 text-left" : "mb-10 text-center"}`}>
            <h1 className="m-0 text-[2rem] font-black leading-tight tracking-normal text-[#020817] max-sm:text-[1.75rem]">{current.title}</h1>
            {mode === "register" ? (
              <p className="mt-3 text-base text-[#667085]">
                {current.switchText}{" "}
                <Link className="font-bold text-[#17151f] underline underline-offset-4" href={current.switchHref}>
                  {current.switchLink}
                </Link>
              </p>
            ) : (
              <p className="mt-2 text-[0.95rem] text-[#667085]">{current.subtitle}</p>
            )}
          </div>

          <form className="grid gap-4" noValidate onSubmit={submitAuth}>
            {mode === "register" ? (
              <div className="grid gap-2">
                <span className="text-sm font-semibold text-[#344054]">用户名</span>
                <Input
                  autoComplete="username"
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="输入你的用户名"
                  type="text"
                  value={username}
                />
              </div>
            ) : null}

            {mode === "login" ? (
              <div className="grid gap-2">
                <span className="text-sm font-semibold text-[#344054]">用户名或邮箱</span>
                <Input
                  autoComplete="username"
                  onBlur={() => setIsTyping(false)}
                  onChange={(event) => setIdentifier(event.target.value)}
                  onFocus={() => setIsTyping(true)}
                  placeholder="anna 或 anna@gmail.com"
                  type="text"
                  value={identifier}
                />
              </div>
            ) : mode === "forgot" ? (
              <div className="grid gap-2">
                <span className="text-sm font-semibold text-[#344054]">邮箱</span>
                <Input
                  autoComplete="email"
                  onBlur={() => setIsTyping(false)}
                  onChange={(event) => setEmail(event.target.value)}
                  onFocus={() => setIsTyping(true)}
                  placeholder="anna@gmail.com"
                  type="email"
                  value={email}
                />
              </div>
            ) : null}

            {requiresPassword ? (
              <div className="grid gap-2">
                <span className="text-sm font-semibold text-[#344054]">密码</span>
                <span className="relative">
                  <Input
                    autoComplete={mode === "register" ? "new-password" : "current-password"}
                    className="pr-12"
                    onBlur={() => setIsPasswordFocused(false)}
                    onChange={(event) => setPassword(event.target.value)}
                    onFocus={() => setIsPasswordFocused(true)}
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    value={password}
                  />
                  <button
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-[#667085] transition hover:bg-[#f2f4f7] hover:text-[#101828]"
                    onClick={() => setShowPassword((value) => !value)}
                    type="button"
                  >
                    <EyeIcon off={showPassword} />
                  </button>
                </span>
              </div>
            ) : null}

            {mode === "register" ? (
              <div className="grid gap-2">
                <span className="text-sm font-semibold text-[#344054]">确认密码</span>
                <span className="relative">
                  <Input
                    autoComplete="new-password"
                    className="pr-12"
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="再次输入密码"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                  />
                  <button
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-[#667085] transition hover:bg-[#f2f4f7] hover:text-[#101828]"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    type="button"
                  >
                    <EyeIcon off={showConfirmPassword} />
                  </button>
                </span>
              </div>
            ) : null}

            {mode === "register" ? (
              <div className="grid gap-2">
                <span className="text-sm font-semibold text-[#344054]">电子邮件</span>
                <Input
                  autoComplete="email"
                  onBlur={() => setIsTyping(false)}
                  onChange={(event) => setEmail(event.target.value)}
                  onFocus={() => setIsTyping(true)}
                  placeholder="anna@gmail.com"
                  type="email"
                  value={email}
                />
              </div>
            ) : null}

            {mode === "register" ? (
              <div className="grid gap-2">
                <span className="text-sm font-semibold text-[#344054]">邮箱验证码</span>
                <span className="grid grid-cols-[1fr_140px] gap-2.5 max-sm:grid-cols-1">
                  <Input
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    onChange={(event) => setEmailCode(event.target.value)}
                    placeholder="输入 6 位验证码"
                    type="text"
                    value={emailCode}
                  />
                  <Button
                    className="min-h-12 w-full whitespace-nowrap"
                    disabled={isLoading}
                    onClick={async () => {
                      setError("");
                      setMessage("");
                      await sendRegisterCode();
                    }}
                    size="lg"
                    type="button"
                  >
                    {isCodeSent ? "重新发送" : "获取验证码"}
                  </Button>
                </span>
              </div>
            ) : null}

            {mode === "login" ? (
              <div className="flex items-center justify-between gap-4 max-sm:items-start max-sm:flex-col">
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-[#344054]">
                  <Checkbox checked={remember} onCheckedChange={(value) => setRemember(value === true)} />
                  <span>记住 30 天</span>
                </label>
                <Link className="text-sm font-bold text-[#17151f] hover:underline" href="/forgot-password">
                  找回密码
                </Link>
              </div>
            ) : null}

            {error ? <div className="m-0 rounded-xl border border-red-300 bg-red-50 px-3 py-2.5 font-bold text-red-700">{error}</div> : null}
            {message ? <div className="m-0 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2.5 font-bold text-emerald-700">{message}</div> : null}

            <Button className="min-h-12 w-full" disabled={isLoading} size="lg" type="submit" variant="solid">
              {isLoading ? "处理中..." : mode === "register" && isCodeSent ? "完成注册" : current.action}
            </Button>
          </form>

          {mode === "register" ? null : (
            <p className="mt-8 text-center text-sm text-[#667085] [&_a]:font-bold [&_a]:text-[#17151f] [&_a]:hover:underline">
              {current.switchText} <Link href={current.switchHref}>{current.switchLink}</Link>
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
