import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      className={cn(
        "flex min-h-12 w-full rounded-xl border border-[#d0d5dd] bg-white px-3.5 text-base text-[#101828] outline-none transition file:border-0 file:bg-transparent file:font-semibold placeholder:text-[#667085] disabled:cursor-not-allowed disabled:opacity-60 focus:border-[#17151f] focus:ring-4 focus:ring-[#17151f14]",
        className
      )}
      ref={ref}
      type={type}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
