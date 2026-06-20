import * as React from "react";
import { Badge } from "@/components/ui/badge";

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

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

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
    <Component className={cx("panel card", wide && "wide", relaxed && "panel--relaxed", className)} {...props}>
      {badge ? <Badge variant={badgeVariant}>{badge}</Badge> : null}
      {title ? <h1>{title}</h1> : null}
      {description ? <p>{description}</p> : null}
      {children}
      {actions ? <div className="panel-actions">{actions}</div> : null}
    </Component>
  );
}
