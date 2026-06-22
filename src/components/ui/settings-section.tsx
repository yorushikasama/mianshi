import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/shiny-button";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "hot" | "ok";

type SettingsSectionProps = React.HTMLAttributes<HTMLElement> & {
  badge?: React.ReactNode;
  badgeVariant?: BadgeVariant;
  title: React.ReactNode;
  description?: React.ReactNode;
  status?: React.ReactNode;
  calloutTitle?: React.ReactNode;
  callout?: React.ReactNode;
  actions?: React.ReactNode;
};

type SettingsEntryProps = {
  title: React.ReactNode;
  description: React.ReactNode;
  action?: React.ReactNode;
  href?: string;
  status?: React.ReactNode;
};

type SettingsSubpageHeaderProps = {
  badge: React.ReactNode;
  title: React.ReactNode;
  description: React.ReactNode;
  status?: React.ReactNode;
};

export function SettingsEntry({
  title,
  description,
  action = "进入",
  href,
  status
}: SettingsEntryProps) {
  const className =
    "flex w-full items-center justify-between gap-4 rounded-[18px] border border-[#17151f14] bg-white/50 px-4 py-3.5 text-left text-inherit no-underline transition hover:-translate-y-px hover:border-[#17151f29] hover:bg-white/80 max-[860px]:flex-col max-[860px]:items-start";
  const content = (
    <>
      <span className="grid gap-1">
        <strong className="text-[#17151f]">{title}</strong>
        <small className="text-[#17151f8f]">{description}</small>
      </span>
      <span className="flex shrink-0 items-center gap-2 text-[0.86rem] font-bold text-[#17151f7a]">
        {status ? <Badge>{status}</Badge> : null}
        {action}
      </span>
    </>
  );

  if (href) {
    return (
      <Link className={className} href={href}>
        {content}
      </Link>
    );
  }

  return (
    <button className={className} type="button">
      {content}
    </button>
  );
}

export function SettingsSection({
  badge,
  badgeVariant = "default",
  title,
  description,
  status,
  calloutTitle,
  callout,
  actions,
  className,
  children,
  ...props
}: SettingsSectionProps) {
  return (
    <Panel className={cn("grid gap-4", className)} {...props}>
      <div className="flex items-start justify-between gap-4">
        <div className="grid gap-2">
          {badge ? <Badge variant={badgeVariant}>{badge}</Badge> : null}
          <h2 className="m-0 text-xl font-black text-[#17151f]">{title}</h2>
          {description ? <p className="m-0 max-w-2xl text-[var(--muted)]">{description}</p> : null}
        </div>
        {status ? <span className="inline-flex min-h-8 shrink-0 items-center rounded-full border border-black/10 bg-white/70 px-3 text-sm font-bold text-[#17151f]/70">{status}</span> : null}
      </div>

      {callout ? (
        <div className="grid gap-1.5 rounded-2xl border border-violet-500/15 bg-violet-500/5 p-4">
          {calloutTitle ? <strong>{calloutTitle}</strong> : null}
          <span className="text-[var(--muted)]">{callout}</span>
        </div>
      ) : null}

      {children}
      {actions ? <div className="flex flex-wrap gap-2.5">{actions}</div> : null}
    </Panel>
  );
}

export function SettingsSubpageHeader({
  badge,
  title,
  description,
  status
}: SettingsSubpageHeaderProps) {
  return (
    <Panel className="grid gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid max-w-2xl gap-2">
          <Badge variant="hot">{badge}</Badge>
          <h1 className="m-0 text-2xl font-black leading-tight text-[#17151f] md:text-3xl">{title}</h1>
          <p className="m-0 text-sm leading-relaxed text-[#17151f99]">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {status ? <Badge>{status}</Badge> : null}
          <Button href="/settings" size="sm">返回设置</Button>
        </div>
      </div>
    </Panel>
  );
}
