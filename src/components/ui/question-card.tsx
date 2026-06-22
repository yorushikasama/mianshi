import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type QuestionCardProps = React.HTMLAttributes<HTMLElement> & {
  title: React.ReactNode;
  source?: React.ReactNode;
  difficulty?: React.ReactNode;
  action?: React.ReactNode;
};

export function QuestionCard({
  title,
  source,
  difficulty,
  action,
  className,
  ...props
}: QuestionCardProps) {
  return (
    <article
      className={cn(
        "grid content-start rounded-xl border border-[var(--border)] bg-white/70 p-4 hover:border-black/20 hover:bg-white/85",
        className
      )}
      {...props}
    >
      {source ? <Badge>{source}</Badge> : null}
      <h3 className="my-3 min-h-12 text-base font-black leading-snug text-[#17151f]">{title}</h3>
      {difficulty ? <p className="text-[var(--muted)]">{difficulty}</p> : null}
      {action ? <div className="mt-4 self-end">{action}</div> : null}
    </article>
  );
}
