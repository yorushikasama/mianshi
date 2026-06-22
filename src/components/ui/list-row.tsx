import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ListRowProps = {
  title: React.ReactNode;
  meta?: React.ReactNode;
  action?: React.ReactNode;
  href?: string;
  className?: string;
  children?: React.ReactNode;
};

function ListRowContent({ title, meta, action, children }: ListRowProps) {
  return (
    <>
      <div className="grid min-w-0 gap-1">
        <strong className="text-[#17151f]">{title}</strong>
        {meta ? <span className="text-[var(--muted)]">{meta}</span> : null}
        {children}
      </div>
      {action}
    </>
  );
}

export function ListRow(props: ListRowProps) {
  const { href, className } = props;

  if (href) {
    return (
      <Link
        className={cn(
          "flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-white/70 p-3.5 text-inherit no-underline hover:border-black/20 hover:bg-white/85 max-[860px]:flex-col max-[860px]:items-start",
          className
        )}
        href={href}
      >
        <ListRowContent {...props} />
      </Link>
    );
  }

  return (
    <article
      className={cn(
        "flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-white/70 p-3.5 max-[860px]:flex-col max-[860px]:items-start",
        className
      )}
    >
      <ListRowContent {...props} />
    </article>
  );
}
