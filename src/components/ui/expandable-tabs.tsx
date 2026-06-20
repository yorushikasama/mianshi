"use client";

import Link from "next/link";
import * as React from "react";

type Tab = {
  title: string;
  icon: React.ReactNode;
  href?: string;
  type?: never;
};

type Separator = {
  type: "separator";
  title?: never;
  icon?: never;
  href?: never;
};

export type ExpandableTabItem = Tab | Separator;

export type ExpandableTabsProps = {
  tabs: ExpandableTabItem[];
  className?: string;
  selectedIndex?: number | null;
  defaultSelectedIndex?: number | null;
  collapseOnOutside?: boolean;
  ariaLabel?: string;
  onChange?: (index: number | null) => void;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function ExpandableTabLabel({ title }: { title: string }) {
  const textRef = React.useRef<HTMLSpanElement>(null);
  const [width, setWidth] = React.useState(0);

  React.useLayoutEffect(() => {
    if (!textRef.current) return;
    setWidth(textRef.current.scrollWidth);
  }, [title]);

  return (
    <span
      className="expandable-tabs__label"
      style={{ "--expandable-tab-label-width": `${width}px` } as React.CSSProperties}
    >
      <span className="expandable-tabs__label-text" ref={textRef}>
        {title}
      </span>
    </span>
  );
}

export function ExpandableTabs({
  tabs,
  className,
  selectedIndex,
  defaultSelectedIndex = null,
  collapseOnOutside = true,
  ariaLabel,
  onChange
}: ExpandableTabsProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [internalSelected, setInternalSelected] = React.useState<number | null>(defaultSelectedIndex);
  const isControlled = selectedIndex !== undefined;
  const selected = isControlled ? selectedIndex : internalSelected;

  React.useEffect(() => {
    if (!collapseOnOutside) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current || rootRef.current.contains(event.target as Node)) return;
      if (!isControlled) setInternalSelected(null);
      onChange?.(null);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [collapseOnOutside, isControlled, onChange]);

  function select(index: number) {
    if (!isControlled) setInternalSelected(index);
    onChange?.(index);
  }

  return (
    <div className={cx("expandable-tabs", className)} ref={rootRef} role="list" aria-label={ariaLabel}>
      {tabs.map((tab, index) => {
        if (tab.type === "separator") {
          return <span aria-hidden="true" className="expandable-tabs__separator" key={`separator-${index}`} />;
        }

        const isSelected = selected === index;
        const content = (
          <>
            <span className="expandable-tabs__icon" aria-hidden="true">
              {tab.icon}
            </span>
            <ExpandableTabLabel title={tab.title} />
          </>
        );
        const classNameForItem = cx("expandable-tabs__item", isSelected && "is-selected");

        if (tab.href) {
          return (
            <Link
              aria-current={isSelected ? "page" : undefined}
              className={classNameForItem}
              href={tab.href}
              key={tab.title}
              onClick={() => select(index)}
              role="listitem"
            >
              {content}
            </Link>
          );
        }

        return (
          <button
            className={classNameForItem}
            key={tab.title}
            onClick={() => select(index)}
            role="listitem"
            type="button"
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
