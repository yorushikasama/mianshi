"use client";

import { useEffect, useState } from "react";
import { DropdownSelect } from "@/components/ui/dropdown-menu";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
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

type ProviderConfig = {
  id: string;
  name: string;
  format: string;
  baseUrl: string;
  model: string;
  maskedKey: string;
  active: boolean;
  lastTestStatus: string;
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers
    }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error ?? "请求失败");
  }
  return body;
}

function testStatusText(status: string) {
  return status === "ok" ? "可用" : "未测试";
}

export default function AiProviderSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const activeProvider = providers.find((item) => item.active);

  async function loadProviders() {
    const data = await api<{ providers: ProviderConfig[] }>("/api/ai-provider-configs");
    setProviders(data.providers);
  }

  useEffect(() => {
    loadProviders()
      .catch((error) => setMessage(error instanceof Error ? error.message : "加载失败"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="grid gap-[18px]">
      <SettingsSubpageHeader
        badge="LiteLLM 接入配置"
        description="可以保存多个用户自己的 AI Provider，使用时只激活其中一个。"
        status={message || `当前激活：${activeProvider?.name ?? "未选择"}`}
        title="AI Provider 管理"
      />

      <div className="grid gap-[18px] xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel
          description="激活的配置会作为生成题目、批改和反馈的默认模型来源。"
          title="已保存 Provider"
        >
          <div className="mt-4 grid gap-3">
            {loading ? <p className="text-sm font-bold text-[#17151f73]">加载中...</p> : null}
            {!loading && providers.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-[#17151f24] bg-white/50 p-5 text-sm font-bold text-[#17151f73]">
                还没有保存 Provider。保存不会自动激活，保存后再点击“设为激活”。
              </p>
            ) : null}
            {providers.map((provider) => {
              const active = provider.active;

              return (
                <article
                  className={[
                    "grid gap-4 rounded-2xl border p-4 transition md:grid-cols-[minmax(0,1fr)_auto] md:items-center",
                    active ? "border-[#17151f] bg-white text-[#17151f]" : "border-[#17151f12] bg-white/65 text-[#17151f] hover:bg-white"
                  ].join(" ")}
                  key={provider.id}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-lg">{provider.name}</strong>
                      <span className="rounded-full bg-[#17151f0a] px-2.5 py-1 text-xs font-bold text-[#17151f73]">
                        {provider.format}
                      </span>
                      {active ? <span className="rounded-full bg-black px-2.5 py-1 text-xs font-bold text-white">使用中</span> : null}
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-[#17151f73] lg:grid-cols-[minmax(120px,0.55fr)_minmax(0,1fr)]">
                      <span className="font-bold text-[#17151f]">{provider.model}</span>
                      <span className="truncate">{provider.baseUrl}</span>
                      <span>{provider.maskedKey}</span>
                      <span>{testStatusText(provider.lastTestStatus)}</span>
                    </div>
                  </div>
                  <Toolbar>
                    <Button
                      onClick={async () => {
                        try {
                          await api(`/api/ai-provider-configs/${provider.id}/test`, { method: "POST" });
                          await loadProviders();
                          setMessage(`${provider.name} 连接成功`);
                        } catch (error) {
                          setMessage(error instanceof Error ? error.message : "测试失败");
                        }
                      }}
                      size="sm"
                      type="button"
                    >
                      测试连接
                    </Button>
                    <Button
                      disabled={active}
                      onClick={async () => {
                        try {
                          await api(`/api/ai-provider-configs/${provider.id}/activate`, { method: "POST" });
                          await loadProviders();
                          setMessage(`已激活 ${provider.name}`);
                        } catch (error) {
                          setMessage(error instanceof Error ? error.message : "激活失败");
                        }
                      }}
                      size="sm"
                      type="button"
                      variant={active ? "ghost" : "solid"}
                    >
                      {active ? "使用中" : "设为激活"}
                    </Button>
                  </Toolbar>
                </article>
              );
            })}
          </div>
        </Panel>

        <Panel as="aside" className="self-start" title="新增 Provider">
        <form
          className="mt-4 grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            try {
              await api("/api/ai-provider-configs", {
                method: "POST",
                body: JSON.stringify({
                  name: form.get("name"),
                  format: form.get("format"),
                  baseUrl: form.get("baseUrl"),
                  model: form.get("model"),
                  apiKey: form.get("apiKey")
                })
              });

              await loadProviders();
              setFormMessage("保存成功，保存不会自动激活");
              event.currentTarget.reset();
            } catch (error) {
              setFormMessage(error instanceof Error ? error.message : "保存失败");
            }
          }}
        >
          <div className="grid gap-4">
            <FormField label="配置名称">
              <Input name="name" placeholder="例如：DeepSeek 日常练习" />
            </FormField>
            <FormField label="供应商格式">
              <DropdownSelect defaultValue="openai-compatible" name="format" options={providerOptions} />
            </FormField>
            <FormField label="Base URL">
              <Input defaultValue="https://api.openai.com/v1" name="baseUrl" />
            </FormField>
            <FormField label="默认模型">
              <Input defaultValue="gpt-4o-mini" name="model" />
            </FormField>
            <FormField label="API Key">
              <Input autoComplete="off" name="apiKey" placeholder="sk-..." type="password" />
            </FormField>
          </div>
          {formMessage ? (
            <p className="m-0 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2.5 font-bold text-emerald-700">{formMessage}</p>
          ) : null}
          <Toolbar>
            <Button className="w-full" type="submit" variant="solid">保存配置</Button>
          </Toolbar>
        </form>
        </Panel>

        <Panel className="xl:col-span-2" title="连接说明">
          <div className="grid gap-3 text-sm text-[#17151f99] md:grid-cols-3">
            {[  
              ["BYOK", "用户自备 Key，不做平台额度体系。"],
              ["LiteLLM Proxy", "后端阶段统一适配 OpenAI Compatible、Anthropic、Gemini 等格式。"],
              ["测试连接", "当前验证配置可读取，真实模型调用留到生成阶段。"]
            ].map(([title, desc]) => (
              <div className="rounded-2xl border border-[#17151f12] bg-white/65 p-4" key={title}>
                <strong className="block text-[#17151f]">{title}</strong>
                <span>{desc}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </main>
  );
}
