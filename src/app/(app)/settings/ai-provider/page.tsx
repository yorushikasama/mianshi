"use client";

import { useState } from "react";
import { DropdownSelect } from "@/components/ui/dropdown-menu";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/neon-button";
import { Panel } from "@/components/ui/panel";
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
    <main className="page-stack">
      <Panel
        badge="LiteLLM 接入配置"
        badgeVariant="hot"
        description="纯前端 mock：后端阶段再加密保存 API Key 并通过 LiteLLM Proxy 测试连接。"
        title="用户自己的 AI Provider"
      >
        <div className="ai-provider-grid">
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
            <input defaultValue="sk-••••••••••••••••" type="password" />
          </FormField>
        </div>
        {message ? <p className={message === "连接失败" ? "form-error" : "form-success"}>{message}</p> : null}
        <Toolbar>
          <Button onClick={() => setMessage("连接成功")}>测试连接</Button>
          <Button onClick={() => setMessage("保存成功")} variant="solid">保存配置</Button>
        </Toolbar>
      </Panel>
    </main>
  );
}
