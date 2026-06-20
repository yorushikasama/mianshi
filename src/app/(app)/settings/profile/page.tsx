"use client";

import { useState } from "react";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/neon-button";
import { Panel } from "@/components/ui/panel";

export default function ProfileSettingsPage() {
  const [preview, setPreview] = useState("");
  const [message, setMessage] = useState("");

  return (
    <main className="page-stack">
      <Panel badge="个人资料设置" badgeVariant="hot" title="头像和用户名">
        <span className="account-avatar profile-avatar-preview" aria-label="头像预览">
          {preview ? <img alt="" src={preview} /> : "面"}
        </span>
        <div className="form-grid">
          <FormField label="头像">
            <input
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) setPreview(URL.createObjectURL(file));
              }}
              type="file"
            />
          </FormField>
          <FormField label="用户名">
            <input defaultValue="面试训练者" />
          </FormField>
        </div>
        {message ? <p className={message === "保存失败" ? "form-error" : "form-success"}>{message}</p> : null}
        <div className="panel-actions">
          <Button onClick={() => setMessage("保存成功")} variant="solid">保存资料</Button>
          <Button onClick={() => setMessage("保存失败")} neon={false}>模拟失败</Button>
        </div>
      </Panel>
    </main>
  );
}
