import * as React from "react";

type BadgeVariant = "default" | "hot" | "ok";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cx("badge", variant !== "default" && variant, className)}
      {...props}
    />
  );
}
