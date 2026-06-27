import * as React from "react";
import { cn } from "@/lib/utils";

type LabelProps = React.HTMLAttributes<HTMLElement> & {
  as?: "label" | "span";
  htmlFor?: string;
};

const Label = React.forwardRef<HTMLElement, LabelProps>(({ as = "label", className, ...props }, ref) =>
  React.createElement(as, {
    className: cn("text-sm font-bold text-[#17151f]", className),
    ref,
    ...props
  })
);
Label.displayName = "Label";

export { Label };
