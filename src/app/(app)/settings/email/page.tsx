"use client";

import { useEffect, useState } from "react";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/shiny-button";
import { Panel } from "@/components/ui/panel";
import { SettingsSubpageHeader } from "@/components/ui/settings-section";
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
    <main className="grid gap-[18px]">
      <SettingsSubpageHeader
        badge="邮箱验证码"
        description="更换登录邮箱需要验证码确认。当前是纯前端 mock，不会发送真实邮件。"
        status={message || (countdown > 0 ? "验证码已发送" : "待验证")}
        title="更换邮箱"
      />

      <div className="grid gap-[18px] xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel title="邮箱验证">
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            setMessage("邮箱验证码已确认");
          }}
        >
          <div className="rounded-2xl border border-[#17151f12] bg-white/65 p-4">
            <span className="text-xs font-bold text-[#17151f73]">当前邮箱</span>
            <strong className="mt-1 block text-[#17151f]">candidate@example.com</strong>
          </div>
          <div className="relative z-40 grid max-w-xl gap-3">
            <FormField label="新邮箱">
              <Input autoComplete="email" placeholder="new@example.com" type="email" />
            </FormField>
            <FormField label="验证码">
              <Input autoComplete="one-time-code" inputMode="numeric" placeholder="输入 6 位验证码" />
            </FormField>
          </div>
          {message ? <p className="m-0 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2.5 font-bold text-emerald-700">{message}</p> : null}
          <Toolbar>
            <Button disabled={countdown > 0} onClick={() => setCountdown(60)} type="button">
              {countdown > 0 ? `${countdown}s 后重发` : "获取验证码"}
            </Button>
            <Button type="submit" variant="solid">确认更换</Button>
          </Toolbar>
        </form>
        </Panel>

        <Panel title="流程状态">
          <div className="grid gap-3 text-sm text-[#17151f99]">
            <span className="rounded-2xl border border-[#17151f12] bg-white/65 p-4">1. 输入新邮箱</span>
            <span className="rounded-2xl border border-[#17151f12] bg-white/65 p-4">2. 获取验证码</span>
            <span className="rounded-2xl border border-[#17151f12] bg-white/65 p-4">3. 确认绑定</span>
          </div>
        </Panel>
      </div>
    </main>
  );
}
