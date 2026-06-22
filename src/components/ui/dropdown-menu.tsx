"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type DropdownMenuProps = {
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

function DropdownMenu({ label, children, className }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{
    left: number;
    top: number;
    width: number;
    maxHeight: number;
  } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemCount = Math.max(1, React.Children.count(children));

  const syncPosition = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    const gap = 8;
    const margin = 12;
    const width = Math.max(rect.width, 176);
    const left = Math.max(margin, Math.min(rect.left, window.innerWidth - width - margin));
    const below = window.innerHeight - rect.bottom - gap - margin;
    const above = rect.top - gap - margin;
    const openUp = below < 160 && above > below;
    const room = Math.max(80, openUp ? above : below);
    const estimatedHeight = Math.min(288, 12 + itemCount * 36 + Math.max(0, itemCount - 1) * 3);
    const menuHeight = Math.min(estimatedHeight, room);
    const maxHeight = Math.min(288, room);

    setMenuPosition({
      left,
      top: openUp
        ? Math.max(margin, rect.top - menuHeight - gap)
        : Math.min(rect.bottom + gap, window.innerHeight - margin - menuHeight),
      width,
      maxHeight
    });
  }, [itemCount]);

  useEffect(() => {
    function close(event: MouseEvent) {
      const target = event.target as Node;
      if (ref.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }

    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    if (!open) return;

    syncPosition();
    window.addEventListener("resize", syncPosition);
    window.addEventListener("scroll", syncPosition, true);

    return () => {
      window.removeEventListener("resize", syncPosition);
      window.removeEventListener("scroll", syncPosition, true);
    };
  }, [open, syncPosition]);

  return (
    <div className={cn("relative isolate block min-w-0", className)} ref={ref}>
      <button
        aria-expanded={open}
        className="group flex min-h-11 w-full items-center justify-between gap-3 rounded-[14px] border border-[#17151f1a] bg-white/80 px-3 py-0 pl-3.5 text-left text-[0.92rem] font-[760] leading-none text-[#17151f] shadow-[inset_0_1px_0_rgba(255,255,255,0.62),0_8px_22px_rgba(23,21,31,0.05)] transition-[border-color,background,box-shadow,transform] duration-200 hover:border-[#6c3ff53d] hover:bg-white/95 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.78),0_12px_28px_rgba(108,63,245,0.1)] active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6c3ff547] aria-expanded:border-[#6c3ff53d] aria-expanded:bg-white/95 aria-expanded:shadow-[inset_0_1px_0_rgba(255,255,255,0.78),0_12px_28px_rgba(108,63,245,0.1)]"
        onClick={() => {
          if (!open) syncPosition();
          setOpen((value) => !value);
        }}
        ref={buttonRef}
        type="button"
      >
        <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{label}</span>
        <span
          aria-hidden
          className="h-2 w-2 translate-y-[-2px] rotate-45 border-b-2 border-r-2 border-current opacity-60 transition-[opacity,transform] duration-200 group-aria-expanded:translate-y-0.5 group-aria-expanded:rotate-[225deg] group-aria-expanded:opacity-85"
        />
      </button>
      {open && menuPosition && typeof document !== "undefined" ? createPortal(
        <div
          className="fixed z-[1000] grid gap-[3px] overflow-y-auto rounded-2xl border border-[#17151f1a] bg-white/95 p-1.5 shadow-[0_18px_42px_rgba(23,21,31,0.14),inset_0_0_0_1px_rgba(255,255,255,0.62)] backdrop-blur-[18px]"
          onClick={() => setOpen(false)}
          ref={menuRef}
          style={menuPosition}
        >
          {children}
        </div>,
        document.body
      ) : null}
    </div>
  );
}

type DropdownMenuItemProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

function DropdownMenuItem({
  active,
  className,
  type = "button",
  ...props
}: DropdownMenuItemProps) {
  return (
    <button
      className={cn(
        "group flex min-h-9 w-full cursor-pointer items-center gap-[9px] whitespace-nowrap rounded-[11px] border-0 bg-transparent px-2.5 py-0 text-left text-[0.9rem] font-semibold text-[#17151f] transition-colors duration-150 hover:bg-[#6c3ff514]",
        active && "bg-[#6c3ff514]",
        className
      )}
      type={type}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          "h-1.5 w-1.5 flex-none rounded-full bg-transparent",
          active && "bg-[#6c3ff5] shadow-[0_0_0_4px_rgba(108,63,245,0.12)]"
        )}
      />
      <span className="overflow-hidden text-ellipsis">{props.children}</span>
    </button>
  );
}

type DropdownSelectOption = {
  label: React.ReactNode;
  value: string;
};

type DropdownSelectProps = {
  options: DropdownSelectOption[];
  defaultValue?: string;
  className?: string;
  onValueChange?: (value: string) => void;
};

function DropdownSelect({
  options,
  defaultValue,
  className,
  onValueChange
}: DropdownSelectProps) {
  const initialValue = defaultValue ?? options[0]?.value ?? "";
  const [value, setValue] = useState(initialValue);
  const selected = options.find((option) => option.value === value) ?? options[0];

  function selectOption(nextValue: string) {
    setValue(nextValue);
    onValueChange?.(nextValue);
  }

  return (
    <DropdownMenu className={className} label={selected?.label ?? "请选择"}>
      {options.map((option) => (
        <DropdownMenuItem
          active={option.value === value}
          key={option.value}
          onClick={() => selectOption(option.value)}
        >
          {option.label}
        </DropdownMenuItem>
      ))}
    </DropdownMenu>
  );
}

export { DropdownMenu, DropdownMenuItem, DropdownSelect };
