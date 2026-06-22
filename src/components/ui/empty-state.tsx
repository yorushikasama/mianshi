import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/shiny-button";
import { cn } from "@/lib/utils";

type EmptyStateProps = React.HTMLAttributes<HTMLDivElement> & {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  actionProps?: ButtonProps;
};

export function EmptyState({
  title,
  description,
  action,
  actionProps,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div className={cn("grid min-h-44 justify-items-center gap-2.5 p-8 text-center", className)} {...props}>
      <strong className="text-[#17151f]">{title}</strong>
      {description ? <p className="m-0 max-w-md text-[var(--muted)]">{description}</p> : null}
      {action ? <Button {...actionProps}>{action}</Button> : null}
    </div>
  );
}
