"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { targets } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { ExpandableTabs, type ExpandableTabItem } from "@/components/ui/expandable-tabs";
import { ParticleCanvas } from "@/components/ui/particle-canvas-1";
import { Button } from "@/components/ui/shiny-button";
import { cn } from "@/lib/utils";

const nav = [
  ["Dashboard", "/dashboard"],
  ["AI 生成", "/generate"],
  ["题库", "/questions"],
  ["练习", "/practice"],
  ["资料", "/materials"],
  ["设置", "/settings"]
] as const;

function isActiveRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavIcon({ type }: { type: "dashboard" | "generate" | "questions" | "practice" | "materials" | "settings" }) {
  const paths = {
    dashboard: (
      <>
        <path d="M4 11.5 12 5l8 6.5" />
        <path d="M6.5 10.5V19h4v-5h3v5h4v-8.5" />
      </>
    ),
    generate: (
      <>
        <path d="M12 3l1.7 5.1L19 10l-5.3 1.9L12 17l-1.7-5.1L5 10l5.3-1.9L12 3z" />
        <path d="M18.5 15.5 20 20" />
        <path d="M4 16l2 2" />
      </>
    ),
    questions: (
      <>
        <path d="M5 5h14v14H5z" />
        <path d="M8 9h8" />
        <path d="M8 13h5" />
      </>
    ),
    practice: (
      <>
        <path d="M6 17.5 10.5 13l2.5 2.5L19 8" />
        <path d="M5 5h14v14H5z" />
      </>
    ),
    materials: (
      <>
        <path d="M7 4h7l3 3v13H7z" />
        <path d="M14 4v4h4" />
        <path d="M10 13h5" />
        <path d="M10 16h4" />
      </>
    ),
    settings: (
      <>
        <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 3.6 1.7 1.7 0 0 0 10 2.05V2a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15 3.6a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 8a1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15z" />
      </>
    )
  } satisfies Record<string, React.ReactNode>;

  return (
    <svg className="block h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {paths[type]}
    </svg>
  );
}

export function WorkbenchShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const tabItems: ExpandableTabItem[] = [
    { title: "Dashboard", href: "/dashboard", icon: <NavIcon type="dashboard" /> },
    { title: "AI 生成", href: "/generate", icon: <NavIcon type="generate" /> },
    { title: "题库", href: "/questions", icon: <NavIcon type="questions" /> },
    { type: "separator" },
    { title: "练习", href: "/practice", icon: <NavIcon type="practice" /> },
    { title: "资料", href: "/materials", icon: <NavIcon type="materials" /> },
    { title: "设置", href: "/settings", icon: <NavIcon type="settings" /> }
  ];
  const selectedIndex = tabItems.findIndex((item) => item.type !== "separator" && item.href && isActiveRoute(pathname, item.href));
  const mobileLinkClass = (href: string) =>
    cn(
      "rounded-full px-4 py-2.5 font-bold text-[#17151f]/60 hover:bg-[#17151f12] hover:text-[#17151f]",
      isActiveRoute(pathname, href) && "bg-[#17151f12] text-[#17151f] outline outline-1 outline-[#17151f14]"
    );

  return (
    <div className="isolate min-h-screen overflow-x-hidden bg-white text-[#17151f]">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-100">
        <ParticleCanvas />
      </div>
      <div className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.64)_78%,#fff_100%)]" />
      <header className="relative z-[1] flex items-center justify-between gap-5 border-b border-[#17151f14] bg-white/75 px-[clamp(18px,3vw,42px)] py-[18px] backdrop-blur-2xl max-[860px]:px-4 max-[860px]:py-3.5">
        <Link className="flex items-center gap-2.5" href="/dashboard">
          <span className="mr-2.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#17151f] font-black text-white shadow-[0_0_22px_rgba(255,96,213,0.2),0_0_48px_rgba(71,201,255,0.18)]">面</span>
          <strong>面试雷达</strong>
        </Link>
        <nav className="flex items-center gap-1 max-[860px]:hidden" aria-label="主导航">
          <ExpandableTabs
            ariaLabel="主导航"
            collapseOnOutside={false}
            selectedIndex={selectedIndex >= 0 ? selectedIndex : null}
            tabs={tabItems}
          />
        </nav>
        <div className="flex items-center gap-2.5 max-[860px]:hidden">
          <Button className="text-[#17151f]" href="/login" size="sm">
            登录
          </Button>
          <Button className="text-white hover:text-white" href="/register" size="sm" variant="solid">
            注册
          </Button>
        </div>
        <details className="hidden max-[860px]:block">
          <summary className="cursor-pointer list-none rounded-lg border border-[#17151f1f] px-3 py-2 font-bold [&::-webkit-details-marker]:hidden">菜单</summary>
          <nav className="absolute right-[18px] top-[62px] z-50 grid min-w-[180px] rounded-xl border border-[#17151f1a] bg-white/95 p-1.5 shadow-[0_18px_44px_rgba(23,21,31,0.12)]" aria-label="移动端主导航">
            {nav.map(([label, href]) => (
              <Link className={mobileLinkClass(href)} key={href} href={href}>
                {label}
              </Link>
            ))}
            <Link className="rounded-full px-4 py-2.5 font-bold text-[#17151f]/60 hover:bg-[#17151f12] hover:text-[#17151f]" href="/login">登录</Link>
            <Link className="rounded-full px-4 py-2.5 font-bold text-[#17151f]/60 hover:bg-[#17151f12] hover:text-[#17151f]" href="/register">注册</Link>
          </nav>
        </details>
      </header>
      <div className="relative z-[1] grid w-full content-start gap-[clamp(20px,3vw,34px)] p-[clamp(18px,2vw,30px)] max-[860px]:p-4">
        <header className="sticky top-5 z-[3] flex min-h-16 items-center justify-between gap-4 rounded-[22px] border border-[#17151f14] bg-white/75 px-[18px] py-4 shadow-[0_18px_60px_rgba(23,21,31,0.08)] backdrop-blur-[18px] max-[860px]:static max-[860px]:flex-col max-[860px]:items-start">
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge variant="hot">今日目标</Badge>
            <strong>
              {targets.role} · {targets.level}
            </strong>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 text-[0.92rem] text-[#17151f99]">
            <span>{targets.deadline}</span>
            <span>AI 接入未连接</span>
          </div>
        </header>
        {children}
      </div>
      <nav className="fixed bottom-3 left-3 right-3 z-10 hidden grid-cols-6 gap-1 rounded-full border border-[#17151f14] bg-white/95 p-1.5 shadow-[0_18px_60px_rgba(23,21,31,0.08)] max-[860px]:grid" aria-label="移动端导航">
        {nav.map(([label, href]) => (
          <Link className={cn("rounded-full px-1 py-2 text-center text-[0.72rem] font-bold text-[#17151f8f] hover:bg-[#17151f12] hover:text-[#17151f]", isActiveRoute(pathname, href) && "bg-[#17151f12] text-[#17151f] outline outline-1 outline-[#17151f14]")} key={href} href={href}>
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
