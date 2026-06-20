import Link from "next/link";
import { ButtonLink } from "@/components/ui/neon-button";
import { DropdownSelect } from "@/components/ui/dropdown-menu";
import { FormField } from "@/components/ui/form-field";
import { Panel } from "@/components/ui/panel";
import { SettingsSection } from "@/components/ui/settings-section";

const providerOptions = [
  { label: "OpenAI Compatible", value: "openai-compatible" },
  { label: "Anthropic", value: "anthropic" },
  { label: "Gemini", value: "gemini" },
  { label: "自定义网关", value: "custom-gateway" }
];

export default function SettingsPage() {
  return (
    <main className="page-stack">
      <Panel
        badge="设置"
        description="先把用户自己的 AI 接入形态定清楚，后续由后端接 LiteLLM 统一适配。"
        title="训练工作台设置"
      />

      <SettingsSection
        actions={
          <>
            <ButtonLink href="/settings/ai-provider" neon={false} variant="solid">
              配置 AI 接入
            </ButtonLink>
            <ButtonLink href="/settings/ai-provider" neon={false}>
              查看 LiteLLM 方案
            </ButtonLink>
          </>
        }
        badge="AI 接入"
        badgeVariant="hot"
        callout="推荐后端用 LiteLLM Proxy 作为统一适配层。用户只需要填写自己的供应商、Base URL、API Key 和模型名，产品不内置平台额度体系。"
        calloutTitle="BYOK 方案"
        description="当前是纯前端原型，不会真的保存密钥；后端阶段再做加密保存和连接测试。"
        status="未配置"
        title="AI Provider 配置"
      >
        <div className="ai-provider-grid">
          <FormField label="供应商格式" hint="决定后端用哪一种 LiteLLM provider 映射。">
            <DropdownSelect defaultValue="openai-compatible" options={providerOptions} />
          </FormField>
          <FormField label="Base URL" hint="示例：https://api.openai.com/v1 或自建代理地址。">
            <input defaultValue="https://api.openai.com/v1" />
          </FormField>
          <FormField label="默认模型" hint="例如 gpt-4o-mini、claude-3-5-sonnet-latest、gemini-1.5-pro。">
            <input defaultValue="gpt-4o-mini" />
          </FormField>
          <FormField label="API Key" hint="后端阶段只加密保存，不在前端持久化明文。">
            <input defaultValue="sk-••••••••••••••••" type="password" />
          </FormField>
        </div>
        <div className="provider-note-list" aria-label="AI 接入边界">
          <span>LiteLLM 负责统一 OpenAI / Anthropic / Gemini 等调用差异。</span>
          <span>面试雷达只记录用户配置，不管理余额和计费规则。</span>
          <span>new-api 后续可作为 OpenAI Compatible 网关选项，不作为产品主概念。</span>
        </div>
      </SettingsSection>

      <SettingsSection
        badge="账号"
        description="个人资料、安全信息和联系方式后续都在这里维护；当前是纯前端原型。"
        status="原型模式"
        title="账号与安全"
      >
        <div className="account-settings">
          <div className="account-profile-card">
            <span className="account-avatar" aria-hidden>
              面
            </span>
            <div>
              <strong>面试训练者</strong>
              <span>candidate@example.com</span>
            </div>
            <ButtonLink href="/settings/profile" neon={false} size="sm">
              更换头像
            </ButtonLink>
          </div>
          <div className="settings-entry-list">
            <Link className="settings-entry" href="/settings/profile">
              <span>
                <strong>用户名</strong>
                <small>修改展示名称和个人昵称</small>
              </span>
              <em>去修改</em>
            </Link>
            <Link className="settings-entry" href="/settings/email">
              <span>
                <strong>邮箱</strong>
                <small>更换登录邮箱，需要邮箱验证码确认</small>
              </span>
              <em>去绑定</em>
            </Link>
            <Link className="settings-entry" href="/settings/password">
              <span>
                <strong>密码</strong>
                <small>修改登录密码，后端阶段会要求旧密码和二次确认</small>
              </span>
              <em>去修改</em>
            </Link>
            <button className="settings-entry" type="button">
              <span>
                <strong>登录状态</strong>
                <small>查看当前设备会话，后续支持退出其他设备</small>
              </span>
              <em>查看</em>
            </button>
          </div>
        </div>
      </SettingsSection>
    </main>
  );
}
