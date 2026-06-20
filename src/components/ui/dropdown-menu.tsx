"use client";

import React, { useEffect, useRef, useState } from "react";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type DropdownMenuProps = {
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

function DropdownMenu({ label, children, className }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }

    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className={cx("dropdown-menu", className)} ref={ref}>
      <button
        aria-expanded={open}
        className="dropdown-menu__trigger"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        {label}
        <span aria-hidden className="dropdown-menu__chevron" />
      </button>
      {open ? <div className="dropdown-menu__content">{children}</div> : null}
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
      className={cx("dropdown-menu__item", active && "is-active", className)}
      type={type}
      {...props}
    >
      <span aria-hidden className="dropdown-menu__item-dot" />
      <span className="dropdown-menu__item-label">{props.children}</span>
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
