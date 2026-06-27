"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/shiny-button";
import { authClient } from "@/lib/auth-client";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <Button
      className={className}
      onClick={async () => {
        await authClient.signOut();
        router.push("/login");
        router.refresh();
      }}
      size="sm"
      type="button"
    >
      退出登录
    </Button>
  );
}
