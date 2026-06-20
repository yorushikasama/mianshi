"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { targets } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { ExpandableTabs, type ExpandableTabItem } from "@/components/ui/expandable-tabs";
import { ParticleCanvas } from "@/components/ui/particle-canvas-1";
import { ButtonLink } from "@/components/ui/neon-button";

const nav = [
  ["Dashboard", "/dashboard"],
  ["AI 生成", "/generate"],
  ["题库", "/questions"],
  ["练习", "/practice"],
  ["资料", "/materials"],
  ["设置", "/settings"]
] as const;

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
    <svg className="shell-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
  const selectedIndex = tabItems.findIndex((item) => item.type !== "separator" && item.href === pathname);

  return (
    <div className="workbench">
      <div className="workbench-particles">
        <ParticleCanvas />
      </div>
      <header className="shell-navbar">
        <Link className="shell-brand" href="/dashboard">
          <span className="brand-mark">面</span>
          <strong>面试雷达</strong>
        </Link>
        <nav className="shell-navlinks" aria-label="主导航">
          <ExpandableTabs
            ariaLabel="主导航"
            collapseOnOutside={false}
            selectedIndex={selectedIndex >= 0 ? selectedIndex : null}
            tabs={tabItems}
          />
        </nav>
        <div className="shell-auth">
          <ButtonLink className="shell-auth__login" href="/login" neon={false} size="sm" variant="default">
            登录
          </ButtonLink>
          <ButtonLink className="shell-auth__signup" href="/register" size="sm" variant="solid">
            注册
          </ButtonLink>
        </div>
        <details className="shell-mobile-menu">
          <summary>菜单</summary>
          <nav aria-label="移动端主导航">
            {nav.map(([label, href]) => (
              <Link className={pathname === href ? "is-active" : undefined} key={href} href={href}>
                {label}
              </Link>
            ))}
            <Link href="/login">登录</Link>
            <Link href="/register">注册</Link>
          </nav>
        </details>
      </header>
      <div className="workbench-main">
        <header className="topbar card">
          <div>
            <Badge variant="hot">今日目标</Badge>
            <strong>
              {targets.role} · {targets.level}
            </strong>
          </div>
          <div className="topbar-meta">
            <span>{targets.deadline}</span>
            <span>AI 接入未连接</span>
          </div>
        </header>
        {children}
      </div>
      <nav className="bottom-nav" aria-label="移动端导航">
        {nav.slice(0, 5).map(([label, href]) => (
          <Link className={pathname === href ? "is-active" : undefined} key={href} href={href}>
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
