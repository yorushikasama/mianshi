"use client";

import { useState } from "react";
import { DropdownSelect } from "@/components/ui/dropdown-menu";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/shiny-button";
import { Panel } from "@/components/ui/panel";
import { SettingsSubpageHeader } from "@/components/ui/settings-section";
import { Toolbar } from "@/components/ui/toolbar";

const providerOptions = [
  { label: "OpenAI Compatible", value: "openai-compatible" },
  { label: "Anthropic", value: "anthropic" },
  { label: "Gemini", value: "gemini" },
  { label: "自定义网关", value: "custom-gateway" }
];

export default function AiProviderSettingsPage() {
  const [message, setMessage] = useState("");

  return (
    <main className="grid gap-[18px]">
      <SettingsSubpageHeader
        badge="LiteLLM 接入配置"
        description="配置用户自己的 Base URL、API Key 和默认模型。纯前端阶段只做 mock，不会真实保存。"
        status={message || "未连接"}
        title="用户自己的 AI Provider"
      />

      <div className="grid gap-[18px] xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel title="Provider 配置">
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            setMessage("保存成功");
          }}
        >
          <div className="grid grid-cols-2 gap-4 max-[860px]:grid-cols-1">
            <FormField label="供应商格式">
              <DropdownSelect defaultValue="openai-compatible" options={providerOptions} />
            </FormField>
            <FormField label="Base URL">
              <input defaultValue="https://api.openai.com/v1" />
            </FormField>
            <FormField label="默认模型">
              <input defaultValue="gpt-4o-mini" />
            </FormField>
            <FormField label="API Key">
              <input autoComplete="off" defaultValue="sk-••••••••••••••••" type="password" />
            </FormField>
          </div>
          {message ? (
            <p className={message === "连接失败" ? "m-0 rounded-xl border border-red-300 bg-red-50 px-3 py-2.5 font-bold text-red-700" : "m-0 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2.5 font-bold text-emerald-700"}>{message}</p>
          ) : null}
          <Toolbar>
            <Button onClick={() => setMessage("连接成功")} type="button">测试连接</Button>
            <Button type="submit" variant="solid">保存配置</Button>
          </Toolbar>
        </form>
        </Panel>

        <Panel title="连接说明">
          <div className="grid gap-3 text-sm text-[#17151f99]">
            <div className="rounded-2xl border border-[#17151f12] bg-white/65 p-4">
              <strong className="block text-[#17151f]">BYOK</strong>
              <span>用户自备 Key，不做平台额度体系。</span>
            </div>
            <div className="rounded-2xl border border-[#17151f12] bg-white/65 p-4">
              <strong className="block text-[#17151f]">LiteLLM Proxy</strong>
              <span>后端阶段统一适配 OpenAI Compatible、Anthropic、Gemini 等格式。</span>
            </div>
            <div className="rounded-2xl border border-[#17151f12] bg-white/65 p-4">
              <strong className="block text-[#17151f]">测试连接</strong>
              <span>当前只演示状态，真实请求等后端接入后实现。</span>
            </div>
          </div>
        </Panel>
      </div>
    </main>
  );
}
