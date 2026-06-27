import { WorkbenchShell } from "@/components/workbench/workbench-shell";
import { requireUserSession } from "@/lib/server-session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUserSession();

  return <WorkbenchShell>{children}</WorkbenchShell>;
}
