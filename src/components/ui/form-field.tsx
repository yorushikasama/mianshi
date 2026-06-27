import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FormFieldProps = React.HTMLAttributes<HTMLDivElement> & {
  label: React.ReactNode;
  hint?: React.ReactNode;
};

export function FormField({ label, hint, className, children, ...props }: FormFieldProps) {
  return (
    <div className={cn("grid gap-2 font-bold text-[#17151f]", className)} {...props}>
      <Label as="span">{label}</Label>
      {children}
      {hint ? <small className="text-[var(--muted)]">{hint}</small> : null}
    </div>
  );
}
