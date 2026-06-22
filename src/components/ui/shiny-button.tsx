"use client";

import Link from "next/link";
import React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

const animationProps = {
  initial: { "--x": "100%", scale: 0.98 },
  animate: { "--x": "-100%", scale: 1 },
  whileTap: { scale: 0.95 },
  transition: {
    repeat: Infinity,
    repeatType: "loop",
    repeatDelay: 1,
    type: "spring",
    stiffness: 20,
    damping: 15,
    mass: 2,
    scale: {
      type: "spring",
      stiffness: 200,
      damping: 5,
      mass: 0.5
    }
  }
} as const;

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children?: React.ReactNode;
  href?: string;
  size?: "default" | "sm" | "lg";
  variant?: "default" | "solid" | "ghost";
}

const variants = {
  default: "border border-black/10 bg-white text-black shadow-sm hover:shadow",
  solid: "border border-black bg-black text-white shadow-sm hover:shadow-md",
  ghost: "border border-transparent bg-transparent text-black hover:border-black/20 hover:bg-black/5"
};

const sizes = {
  default: "px-6 py-2",
  sm: "px-4 py-1.5",
  lg: "px-8 py-3"
};

const MotionLink = motion.create(Link);

export function ShinyButton({
  children,
  className,
  disabled,
  href,
  size = "default",
  type = "button",
  variant = "default",
  ...props
}: ButtonProps) {
  const content = (
    <>
      <span
        className={cn(
          "relative inline-flex h-full w-full items-center justify-center gap-2 text-sm font-medium tracking-wide",
          variant === "solid" ? "text-white/90" : "text-black/70"
        )}
        style={{
          maskImage:
            "linear-gradient(-75deg,currentColor calc(var(--x) + 20%),transparent calc(var(--x) + 30%),currentColor calc(var(--x) + 100%))"
        }}
      >
        {children}
      </span>
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 z-10 block rounded-[inherit] p-px",
          variant === "solid"
            ? "bg-[linear-gradient(-75deg,rgb(255_255_255/10%)_calc(var(--x)+20%),rgb(255_255_255/55%)_calc(var(--x)+25%),rgb(255_255_255/10%)_calc(var(--x)+100%))]"
            : "bg-[linear-gradient(-75deg,rgb(0_0_0/8%)_calc(var(--x)+20%),rgb(0_0_0/45%)_calc(var(--x)+25%),rgb(0_0_0/8%)_calc(var(--x)+100%))]"
        )}
        style={{
          mask: "linear-gradient(rgb(0,0,0), rgb(0,0,0)) content-box,linear-gradient(rgb(0,0,0), rgb(0,0,0))",
          maskComposite: "exclude"
        }}
      />
    </>
  );
  const classes = cn(
    "relative inline-flex items-center justify-center overflow-hidden rounded-lg font-medium backdrop-blur-xl transition-shadow duration-300 ease-in-out disabled:cursor-not-allowed disabled:opacity-55",
    variants[variant],
    sizes[size],
    className
  );

  if (href) {
    return (
      <MotionLink {...animationProps} href={href} className={classes}>
        {content}
      </MotionLink>
    );
  }

  return (
    <motion.button {...animationProps} {...props} disabled={disabled} type={type} className={classes}>
      {content}
    </motion.button>
  );
}

export const Button = ShinyButton;
