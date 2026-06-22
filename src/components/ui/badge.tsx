import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "hot" | "ok";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variants: Record<BadgeVariant, string> = {
  default: "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]",
  hot: "border-pink-200 bg-pink-50 text-pink-700",
  ok: "border-teal-200 bg-teal-50 text-teal-700"
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-[26px] items-center rounded-full border px-2.5 text-xs font-bold",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
