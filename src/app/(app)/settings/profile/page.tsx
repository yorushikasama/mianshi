"use client";

import { useState } from "react";
import { FileUploadButton } from "@/components/ui/file-upload-button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/shiny-button";
import { Panel } from "@/components/ui/panel";
import { SettingsSubpageHeader } from "@/components/ui/settings-section";

export default function ProfileSettingsPage() {
  const [preview, setPreview] = useState("");
  const [message, setMessage] = useState("");

  return (
    <main className="grid gap-[18px]">
      <SettingsSubpageHeader
        badge="个人资料设置"
        description="管理头像、用户名和展示昵称。邮箱修改放在邮箱设置页处理。"
        status={message || "未保存"}
        title="头像和用户名"
      />

      <div className="grid gap-[18px] xl:grid-cols-[360px_minmax(0,1fr)]">
        <Panel title="资料卡">
          <div className="grid justify-items-center gap-4 text-center">
            <span className="inline-grid h-24 w-24 place-items-center rounded-full border border-[#17151f14] bg-[#17151f] text-3xl font-black text-white shadow-[0_18px_44px_rgba(23,21,31,0.16)]" aria-label="头像预览">
              {preview ? <img className="h-full w-full rounded-[inherit] object-cover" alt="" src={preview} /> : "面"}
            </span>
            <div className="grid gap-1">
              <strong className="text-lg text-[#17151f]">面试训练者</strong>
              <span className="text-sm text-[#17151f73]">candidate@example.com</span>
            </div>
            <FileUploadButton
              accept="image/*"
              onFileChange={(event) => {
                const file = event.target.files?.[0];
                if (file) setPreview(URL.createObjectURL(file));
              }}
            />
          </div>
        </Panel>

        <Panel title="基础信息">
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            setMessage("保存成功");
          }}
        >
          <div className="relative z-40 grid max-w-xl gap-3">
            <FormField label="用户名">
              <Input defaultValue="面试训练者" />
            </FormField>
            <FormField label="展示昵称">
              <Input defaultValue="前端候选人" />
            </FormField>
            <FormField label="登录邮箱" hint="邮箱需要到邮箱设置页修改。">
              <Input defaultValue="candidate@example.com" disabled type="email" />
            </FormField>
          </div>
          {message ? (
            <p className={message === "保存失败" ? "m-0 rounded-xl border border-red-300 bg-red-50 px-3 py-2.5 font-bold text-red-700" : "m-0 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2.5 font-bold text-emerald-700"}>{message}</p>
          ) : null}
          <div className="flex flex-wrap gap-2.5">
            <Button type="submit" variant="solid">保存资料</Button>
            <Button onClick={() => setMessage("保存失败")} type="button">模拟失败</Button>
          </div>
        </form>
        </Panel>
      </div>
    </main>
  );
}
