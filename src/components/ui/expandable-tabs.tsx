"use client";

import Link from "next/link";
import * as React from "react";
import { cn } from "@/lib/utils";

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

function ExpandableTabLabel({ title }: { title: string }) {
  const textRef = React.useRef<HTMLSpanElement>(null);
  const [width, setWidth] = React.useState(0);

  React.useLayoutEffect(() => {
    if (!textRef.current) return;
    setWidth(textRef.current.scrollWidth);
  }, [title]);

  return (
    <span
      className="inline-block w-0 translate-x-[-4px] overflow-hidden opacity-0 transition-[width,opacity,transform] duration-500 group-[.is-selected]:w-(--expandable-tab-label-width) group-[.is-selected]:translate-x-0 group-[.is-selected]:opacity-100 motion-reduce:transition-none"
      style={{ "--expandable-tab-label-width": `${width}px` } as React.CSSProperties}
    >
      <span className="inline-block whitespace-nowrap" ref={textRef}>
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
    <div
      className={cn(
        "mx-auto flex items-center gap-1.5 rounded-[18px] border border-[#17151f14] bg-white/70 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_12px_32px_rgba(23,21,31,0.06)] backdrop-blur-[18px]",
        className
      )}
      ref={rootRef}
      role="list"
      aria-label={ariaLabel}
    >
      {tabs.map((tab, index) => {
        if (tab.type === "separator") {
          return <span aria-hidden="true" className="mx-0.5 h-6 w-px rounded-full bg-[#17151f1a]" key={`separator-${index}`} />;
        }

        const isSelected = selected === index;
        const content = (
          <>
            <span className="inline-flex flex-none items-center justify-center" aria-hidden="true">
              {tab.icon}
            </span>
            <ExpandableTabLabel title={tab.title} />
          </>
        );
        const classNameForItem = cn(
          "group relative inline-flex h-[38px] min-w-9 items-center justify-center gap-0 overflow-hidden whitespace-nowrap rounded-[13px] px-[9px] text-[0.9rem] font-bold leading-none text-[#17151f8f] transition-[gap,padding,background,color,transform] duration-500 hover:-translate-y-px hover:bg-[#17151f0e] hover:text-[#17151f] motion-reduce:transition-none",
          isSelected && "is-selected gap-2 bg-[#17151f12] px-4 text-[#17151f]"
        );

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
