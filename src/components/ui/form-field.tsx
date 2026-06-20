import * as React from "react";

type FormFieldProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
  label: React.ReactNode;
  hint?: React.ReactNode;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function FormField({ label, hint, className, children, ...props }: FormFieldProps) {
  return (
    <label className={cx("form-field-ui", className)} {...props}>
      <span>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}
