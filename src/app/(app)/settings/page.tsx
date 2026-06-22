import { Button } from "@/components/ui/shiny-button";
import { Panel } from "@/components/ui/panel";
import { SettingsEntry, SettingsSection } from "@/components/ui/settings-section";

export default function SettingsPage() {
  return (
    <main className="grid gap-[18px]">
      <Panel
        badge="设置"
        description="管理 AI 接入、账号资料和安全入口。详细配置放在子页面，首页只保留状态和跳转。"
        title="训练工作台设置"
      />

      <div className="grid gap-[18px] xl:grid-cols-[minmax(0,1fr)_390px]">
        <SettingsSection
          badge="AI 接入"
          badgeVariant="hot"
          callout="后端阶段由 LiteLLM Proxy 统一适配 OpenAI Compatible、Anthropic、Gemini 等格式。产品只保存用户自己的 Base URL、API Key 和模型名，不内置额度体系。"
          calloutTitle="BYOK / LiteLLM"
          description="当前未配置真实 Provider，生成题目仍是前端 mock。"
          status="未配置"
          title="AI Provider"
        >
          <div className="grid gap-2.5 sm:grid-cols-3">
            {[
              ["接入层", "LiteLLM"],
              ["默认模型", "未配置"],
              ["额度策略", "用户自备 Key"]
            ].map(([label, value]) => (
              <div className="rounded-2xl border border-[#17151f14] bg-white/65 p-3" key={label}>
                <span className="text-xs font-bold text-[#17151f73]">{label}</span>
                <strong className="mt-1 block text-lg text-[#17151f]">{value}</strong>
              </div>
            ))}
          </div>
          <SettingsEntry
            action="配置"
            description="填写供应商格式、Base URL、API Key 和默认模型。"
            href="/settings/ai-provider"
            title="Provider 配置"
          />
        </SettingsSection>

        <SettingsSection
          badge="账号"
          description="纯前端原型先展示入口，后端接入真实会话后再保存。"
          status="原型模式"
          title="账号概览"
        >
          <div className="grid gap-4">
            <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3.5 rounded-[20px] border border-[#17151f14] bg-white/60 p-3.5">
              <span className="inline-grid h-[52px] w-[52px] place-items-center rounded-full border border-[#17151f14] bg-[#17151f] text-[1.15rem] font-black text-white" aria-hidden>
                面
              </span>
              <div className="grid min-w-0 gap-1">
                <strong className="text-[#17151f]">面试训练者</strong>
                <span className="truncate text-[#17151f8f]">candidate@example.com</span>
              </div>
            </div>
            <Button href="/settings/profile" size="sm">编辑个人资料</Button>
          </div>
        </SettingsSection>
      </div>

      <SettingsSection
        badge="安全"
        description="常用账号动作集中在这里，避免首页直接塞表单。"
        title="账号与安全"
      >
        <div className="grid gap-2.5 md:grid-cols-2">
          <SettingsEntry
            action="去修改"
            description="修改展示名称、个人昵称和头像。"
            href="/settings/profile"
            title="用户名与头像"
          />
          <SettingsEntry
            action="去绑定"
            description="更换登录邮箱，需要邮箱验证码确认。"
            href="/settings/email"
            title="邮箱"
          />
          <SettingsEntry
            action="去修改"
            description="修改登录密码，需要旧密码和二次确认。"
            href="/settings/password"
            title="密码"
          />
          <SettingsEntry
            action="查看"
            description="后端接入真实会话后支持退出其他设备。"
            status="待接入"
            title="登录状态"
          />
        </div>
      </SettingsSection>
    </main>
  );
}
