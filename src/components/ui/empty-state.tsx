import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/neon-button";

type EmptyStateProps = React.HTMLAttributes<HTMLDivElement> & {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  actionProps?: ButtonProps;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function EmptyState({
  title,
  description,
  action,
  actionProps,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div className={cx("empty-state", className)} {...props}>
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
      {action ? <Button {...actionProps}>{action}</Button> : null}
    </div>
  );
}
