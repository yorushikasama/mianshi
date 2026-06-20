import * as React from "react";

type ToolbarProps = React.HTMLAttributes<HTMLDivElement>;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Toolbar({ className, ...props }: ToolbarProps) {
  return <div className={cx("toolbar", className)} {...props} />;
}
