import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "hot" | "ok";

type PageHeaderProps = React.HTMLAttributes<HTMLElement> & {
  badge?: React.ReactNode;
  badgeVariant?: BadgeVariant;
  title: React.ReactNode;
  description?: React.ReactNode;
  media?: React.ReactNode;
};

export function PageHeader({
  badge,
  badgeVariant = "default",
  title,
  description,
  media,
  className,
  children,
  ...props
}: PageHeaderProps) {
  return (
    <section
      className={cn(
        "col-span-full grid gap-5 overflow-hidden rounded-[22px] border border-black/10 bg-white/70 p-6 shadow-[0_18px_60px_rgba(23,21,31,0.08)] backdrop-blur-lg md:p-10",
        media ? "min-h-64 md:grid-cols-[minmax(0,1fr)_minmax(120px,220px)]" : "min-h-[220px]",
        className
      )}
      {...props}
    >
      <div className="min-w-0">
        {badge ? <Badge variant={badgeVariant}>{badge}</Badge> : null}
        <h1 className="my-3 max-w-4xl text-balance text-4xl font-black leading-none text-[#17151f] md:text-6xl">{title}</h1>
        {description ? <p className="max-w-2xl text-[var(--muted)]">{description}</p> : null}
        {children}
      </div>
      {media}
    </section>
  );
}
