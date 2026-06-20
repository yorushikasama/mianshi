import * as React from "react";
import Link from "next/link";

type ListRowProps = {
  title: React.ReactNode;
  meta?: React.ReactNode;
  action?: React.ReactNode;
  href?: string;
  className?: string;
  children?: React.ReactNode;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function ListRowContent({ title, meta, action, children }: ListRowProps) {
  return (
    <>
      <div>
        <strong>{title}</strong>
        {meta ? <span>{meta}</span> : null}
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
      <Link className={cx("list-row", "list-row--link", className)} href={href}>
        <ListRowContent {...props} />
      </Link>
    );
  }

  return (
    <article className={cx("list-row", className)}>
      <ListRowContent {...props} />
    </article>
  );
}
