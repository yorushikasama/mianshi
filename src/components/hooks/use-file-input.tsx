import { useRef, useState } from "react";

interface UseFileInputOptions {
  maxSize?: number;
}

export function useFileInput({ maxSize }: UseFileInputOptions = {}) {
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setError("");

    if (!file) return;

    if (maxSize && file.size > maxSize * 1024 * 1024) {
      setError(`文件大小不能超过 ${maxSize}MB`);
      return;
    }

    setFileName(file.name);
    setFileSize(file.size);
  }

  function clearFile() {
    setFileName("");
    setError("");
    setFileSize(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return { clearFile, error, fileInputRef, fileName, fileSize, handleFileSelect };
}
