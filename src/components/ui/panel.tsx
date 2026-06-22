import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "hot" | "ok";

type PanelProps = React.HTMLAttributes<HTMLElement> & {
  as?: "section" | "aside";
  badge?: React.ReactNode;
  badgeVariant?: BadgeVariant;
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  wide?: boolean;
  relaxed?: boolean;
};

export function Panel({
  as = "section",
  badge,
  badgeVariant = "default",
  title,
  description,
  actions,
  wide = false,
  relaxed = false,
  className,
  children,
  ...props
}: PanelProps) {
  const Component = as;

  return (
    <Component
      className={cn(
        "rounded-[22px] border border-black/10 bg-white/75 p-5 shadow-[0_18px_60px_rgba(23,21,31,0.08)] backdrop-blur-lg",
        wide && "col-span-full",
        relaxed && "p-8 md:p-10",
        className
      )}
      {...props}
    >
      {badge ? <Badge variant={badgeVariant}>{badge}</Badge> : null}
      {title ? <h2 className="my-3 max-w-3xl text-balance text-2xl font-black leading-tight text-[#17151f] md:text-3xl">{title}</h2> : null}
      {description ? <p className="text-[var(--muted)]">{description}</p> : null}
      {children}
      {actions ? <div className="mt-4 flex flex-wrap gap-2.5">{actions}</div> : null}
    </Component>
  );
}
