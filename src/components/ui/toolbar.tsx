import * as React from "react";
import { cn } from "@/lib/utils";

type ToolbarProps = React.HTMLAttributes<HTMLDivElement>;

export function Toolbar({ className, ...props }: ToolbarProps) {
  return <div className={cn("relative z-40 mt-4 grid grid-cols-[repeat(auto-fit,minmax(156px,1fr))] items-center gap-3", className)} {...props} />;
}
