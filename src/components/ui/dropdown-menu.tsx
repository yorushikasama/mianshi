"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import type React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type DropdownSelectOption = {
  label: React.ReactNode;
  value: string;
};

type DropdownSelectProps = {
  options: DropdownSelectOption[];
  defaultValue?: string;
  className?: string;
  name?: string;
  onValueChange?: (value: string) => void;
};

function DropdownSelect({
  options,
  defaultValue,
  className,
  name,
  onValueChange
}: DropdownSelectProps) {
  return (
    <SelectPrimitive.Root
      defaultValue={defaultValue ?? options[0]?.value}
      name={name}
      onValueChange={onValueChange}
    >
      <SelectPrimitive.Trigger
        className={cn(
          "flex min-h-11 w-full min-w-44 items-center justify-between gap-3 rounded-[14px] border border-[#17151f1a] bg-white/90 px-3.5 text-left text-[0.92rem] font-[760] text-[#17151f] shadow-[inset_0_1px_0_rgba(255,255,255,0.62),0_8px_22px_rgba(23,21,31,0.05)] outline-none transition hover:border-[#6c3ff53d] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6c3ff547] data-[state=open]:border-[#6c3ff53d]",
          className
        )}
      >
        <SelectPrimitive.Value placeholder="请选择" />
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="h-4 w-4 opacity-65" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className="z-[1000] max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-2xl border border-[#17151f1a] bg-white/95 p-1.5 shadow-[0_18px_42px_rgba(23,21,31,0.14),inset_0_0_0_1px_rgba(255,255,255,0.62)] backdrop-blur-[18px]"
          position="popper"
          sideOffset={8}
        >
          <SelectPrimitive.Viewport>
            {options.map((option) => (
              <SelectPrimitive.Item
                className="relative flex min-h-9 cursor-pointer select-none items-center rounded-[11px] px-8 py-1.5 text-[0.9rem] font-semibold text-[#17151f] outline-none data-[highlighted]:bg-[#6c3ff514]"
                key={option.value}
                value={option.value}
              >
                <SelectPrimitive.ItemIndicator className="absolute left-2.5 inline-flex items-center">
                  <Check className="h-4 w-4" />
                </SelectPrimitive.ItemIndicator>
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

export { DropdownSelect };
