"use client";

import { useState } from "react";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/neon-button";
import { Panel } from "@/components/ui/panel";

export default function PasswordSettingsPage() {
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [message, setMessage] = useState("");

  return (
    <main className="page-stack">
      <Panel badge="修改登录密码" badgeVariant="hot" title="账号安全">
        <div className="form-grid">
          <FormField label="旧密码">
            <input type="password" />
          </FormField>
          <FormField label="新密码">
            <input onChange={(event) => setNext(event.target.value)} type="password" />
          </FormField>
          <FormField label="重复新密码">
            <input onChange={(event) => setRepeat(event.target.value)} type="password" />
          </FormField>
        </div>
        {message ? <p className={message === "密码不一致" ? "form-error" : "form-success"}>{message}</p> : null}
        <Button
          onClick={() => setMessage(next && next === repeat ? "密码已更新" : "密码不一致")}
          variant="solid"
        >
          更新密码
        </Button>
      </Panel>
    </main>
  );
}
