import * as React from "react";
import { Badge } from "@/components/ui/badge";

type BadgeVariant = "default" | "hot" | "ok";

type PageHeaderProps = React.HTMLAttributes<HTMLElement> & {
  badge?: React.ReactNode;
  badgeVariant?: BadgeVariant;
  title: React.ReactNode;
  description?: React.ReactNode;
  media?: React.ReactNode;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function PageHeader({
  badge,
  badgeVariant = "default",
  title,
  description,
  media,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <section className={cx("hero-card card", className)} {...props}>
      <div>
        {badge ? <Badge variant={badgeVariant}>{badge}</Badge> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {media}
    </section>
  );
}
