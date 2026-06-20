"use client";

import { useEffect, useState } from "react";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/neon-button";
import { Panel } from "@/components/ui/panel";
import { Toolbar } from "@/components/ui/toolbar";

export default function EmailSettingsPage() {
  const [countdown, setCountdown] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  return (
    <main className="page-stack">
      <Panel badge="邮箱验证码" badgeVariant="hot" title="更换邮箱">
        <div className="form-grid">
          <FormField label="新邮箱">
            <input defaultValue="candidate@example.com" type="email" />
          </FormField>
          <FormField label="验证码">
            <input inputMode="numeric" placeholder="输入 6 位验证码" />
          </FormField>
        </div>
        {message ? <p className="form-success">{message}</p> : null}
        <Toolbar>
          <Button disabled={countdown > 0} onClick={() => setCountdown(60)}>
            {countdown > 0 ? `${countdown}s 后重发` : "获取验证码"}
          </Button>
          <Button onClick={() => setMessage("邮箱验证码已确认")} variant="solid">确认更换</Button>
        </Toolbar>
      </Panel>
    </main>
  );
}
