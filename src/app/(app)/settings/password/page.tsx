"use client";

import { useState } from "react";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/shiny-button";
import { Panel } from "@/components/ui/panel";
import { SettingsSubpageHeader } from "@/components/ui/settings-section";
import { authClient } from "@/lib/auth-client";

export default function PasswordSettingsPage() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <main className="grid gap-[18px]">
      <SettingsSubpageHeader
        badge="账号安全"
        description="更新登录密码。提交后会由 Better Auth 校验旧密码。"
        status={message || "已接入认证"}
        title="修改登录密码"
      />

      <div className="grid gap-[18px] xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel title="密码信息">
        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setMessage("");
            setIsError(false);

            if (!current || !next || !repeat) {
              setIsError(true);
              setMessage("请完整填写密码");
              return;
            }

            if (next !== repeat) {
              setIsError(true);
              setMessage("两次输入的新密码不一致");
              return;
            }

            setIsLoading(true);
            const result = await authClient.changePassword({
              currentPassword: current,
              newPassword: next
            });
            setIsLoading(false);

            if (result.error) {
              setIsError(true);
              setMessage(result.error.message || "更新失败，请检查旧密码");
              return;
            }

            setCurrent("");
            setNext("");
            setRepeat("");
            setMessage("密码已更新");
          }}
        >
          <div className="relative z-40 grid max-w-xl gap-3">
            <FormField label="旧密码">
              <Input
                autoComplete="current-password"
                onChange={(event) => setCurrent(event.target.value)}
                type="password"
                value={current}
              />
            </FormField>
            <FormField label="新密码">
              <Input
                autoComplete="new-password"
                onChange={(event) => setNext(event.target.value)}
                type="password"
                value={next}
              />
            </FormField>
            <FormField label="重复新密码">
              <Input
                autoComplete="new-password"
                onChange={(event) => setRepeat(event.target.value)}
                type="password"
                value={repeat}
              />
            </FormField>
          </div>
          {message ? (
            <p className={isError ? "m-0 rounded-xl border border-red-300 bg-red-50 px-3 py-2.5 font-bold text-red-700" : "m-0 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2.5 font-bold text-emerald-700"}>{message}</p>
          ) : null}
          <Button disabled={isLoading} type="submit" variant="solid">
            {isLoading ? "更新中..." : "更新密码"}
          </Button>
        </form>
        </Panel>

        <Panel title="密码规则">
          <ul className="m-0 grid gap-2.5 p-0 text-sm text-[#17151f99]">
            {["至少 8 位", "建议包含字母和数字", "不要和常用网站密码相同"].map((item) => (
              <li className="list-none rounded-xl border border-[#17151f12] bg-white/65 px-3 py-2.5" key={item}>{item}</li>
            ))}
          </ul>
        </Panel>
      </div>
    </main>
  );
}
