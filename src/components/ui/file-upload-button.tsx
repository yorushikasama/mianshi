"use client";

import React, { useRef } from "react";
import { Button, type ButtonProps } from "@/components/ui/shiny-button";

type FileUploadButtonProps = Omit<ButtonProps, "href" | "onClick" | "type"> & {
  accept?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  multiple?: boolean;
  name?: string;
  onFileChange?: React.ChangeEventHandler<HTMLInputElement>;
};

export function FileUploadButton({
  accept,
  children = "选择文件",
  inputRef,
  multiple,
  name,
  onFileChange,
  ...buttonProps
}: FileUploadButtonProps) {
  const ownRef = useRef<HTMLInputElement>(null);
  const fileInputRef = inputRef ?? ownRef;

  return (
    <>
      <Button {...buttonProps} onClick={() => fileInputRef.current?.click()} type="button">
        {children}
      </Button>
      <input
        accept={accept}
        className="hidden"
        multiple={multiple}
        name={name}
        onChange={onFileChange}
        ref={fileInputRef}
        type="file"
      />
    </>
  );
}
