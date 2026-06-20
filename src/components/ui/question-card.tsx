import * as React from "react";
import { Badge } from "@/components/ui/badge";

type QuestionCardProps = React.HTMLAttributes<HTMLElement> & {
  title: React.ReactNode;
  source?: React.ReactNode;
  difficulty?: React.ReactNode;
  action?: React.ReactNode;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function QuestionCard({
  title,
  source,
  difficulty,
  action,
  className,
  ...props
}: QuestionCardProps) {
  return (
    <article className={cx("question-card", className)} {...props}>
      {source ? <Badge>{source}</Badge> : null}
      <h3>{title}</h3>
      {difficulty ? <p>{difficulty}</p> : null}
      {action}
    </article>
  );
}
