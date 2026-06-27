import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        "flex min-h-28 w-full resize-y rounded-xl border border-[#d0d5dd] bg-white px-3.5 py-3 text-base text-[#101828] outline-none transition placeholder:text-[#667085] disabled:cursor-not-allowed disabled:opacity-60 focus:border-[#17151f] focus:ring-4 focus:ring-[#17151f14]",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export { Textarea };
