import { WorkbenchShell } from "@/components/workbench/workbench-shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <WorkbenchShell>{children}</WorkbenchShell>;
}
