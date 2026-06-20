import React from "react";
import Link from "next/link";

type ButtonVariant = "default" | "solid" | "ghost";
type ButtonSize = "default" | "sm" | "lg";

type ButtonVariantOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

const variantClasses: Record<ButtonVariant, string> = {
  default: "neon-button--default",
  solid: "neon-button--solid",
  ghost: "neon-button--ghost"
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "neon-button--default-size",
  sm: "neon-button--sm",
  lg: "neon-button--lg"
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function buttonVariants({
  variant = "default",
  size = "default",
  className
}: ButtonVariantOptions = {}) {
  return cx("neon-button", variantClasses[variant], sizeClasses[size], className);
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariantOptions {
  neon?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, neon = true, size, variant, children, ...props }, ref) => {
    return (
      <button className={buttonVariants({ variant, size, className })} ref={ref} {...props}>
        <span className={cx("neon-button__line neon-button__line--top", neon && "is-on")} />
        {children}
        <span className={cx("neon-button__line neon-button__line--bottom", neon && "is-on")} />
      </button>
    );
  }
);

Button.displayName = "Button";

export interface ButtonLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
    ButtonVariantOptions {
  href: string;
  neon?: boolean;
}

const ButtonLink = React.forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  ({ className, href, neon = true, size, variant, children, ...props }, ref) => {
    return (
      <Link
        className={buttonVariants({ variant, size, className })}
        href={href}
        ref={ref}
        {...props}
      >
        <span className={cx("neon-button__line neon-button__line--top", neon && "is-on")} />
        {children}
        <span className={cx("neon-button__line neon-button__line--bottom", neon && "is-on")} />
      </Link>
    );
  }
);

ButtonLink.displayName = "ButtonLink";

export { Button, ButtonLink, buttonVariants };
