"use client";

import { useState } from "react";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/shiny-button";
import { Panel } from "@/components/ui/panel";
import { SettingsSubpageHeader } from "@/components/ui/settings-section";

export default function PasswordSettingsPage() {
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [message, setMessage] = useState("");

  return (
    <main className="grid gap-[18px]">
      <SettingsSubpageHeader
        badge="账号安全"
        description="更新登录密码。后端接入真实会话后，这里会支持让其他设备重新登录。"
        status="原型模式"
        title="修改登录密码"
      />

      <div className="grid gap-[18px] xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel title="密码信息">
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            setMessage(next && next === repeat ? "密码已更新" : "密码不一致");
          }}
        >
          <div className="relative z-40 grid max-w-xl gap-3">
            <FormField label="旧密码">
              <input autoComplete="current-password" type="password" />
            </FormField>
            <FormField label="新密码">
              <input autoComplete="new-password" onChange={(event) => setNext(event.target.value)} type="password" />
            </FormField>
            <FormField label="重复新密码">
              <input autoComplete="new-password" onChange={(event) => setRepeat(event.target.value)} type="password" />
            </FormField>
          </div>
          {message ? (
            <p className={message === "密码不一致" ? "m-0 rounded-xl border border-red-300 bg-red-50 px-3 py-2.5 font-bold text-red-700" : "m-0 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2.5 font-bold text-emerald-700"}>{message}</p>
          ) : null}
          <Button type="submit" variant="solid">更新密码</Button>
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
