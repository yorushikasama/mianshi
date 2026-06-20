import { candidateQuestions, todayTasks, weakAreas } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { ListRow } from "@/components/ui/list-row";
import { ButtonLink } from "@/components/ui/neon-button";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { QuestionCard } from "@/components/ui/question-card";

export default function DashboardPage() {
  return (
    <main className="page-grid">
      <PageHeader
        badge="今日训练"
        badgeVariant="hot"
        description="训练搭档建议从项目追问开始，今天重点补表达结构。"
        media={
          <div className="mini-companion" aria-label="训练搭档头像">
            <span />
          </div>
        }
        title="先练 3 题，把薄弱点打下来。"
      />

      <Panel title="任务板">
        <div className="list">
          {todayTasks.map((task) => (
            <ListRow
              action={<Badge variant="hot">{task.state}</Badge>}
              href={task.href}
              key={task.title}
              meta={task.tag}
              title={task.title}
            />
          ))}
        </div>
      </Panel>

      <Panel title="今日复习队列">
        <div className="list">
          <ListRow
            action={<Badge variant="hot">复习到期</Badge>}
            href="/practice/next-app-router"
            meta="问答题 · 10 分钟"
            title="Next.js App Router"
          />
          <ListRow
            action={<Badge>待巩固</Badge>}
            href="/practice/frontend-degrade"
            meta="选择题 · 3 分钟"
            title="接口降级方案"
          />
        </div>
      </Panel>

      <Panel title="薄弱警报">
        <div className="list">
          {weakAreas.map((area) => (
            <ListRow
              action={<strong>{area.score}</strong>}
              href="/questions"
              key={area.name}
              meta={<meter min="0" max="100" value={area.score} />}
              title={area.name}
            />
          ))}
        </div>
      </Panel>

      <Panel title="AI 接入状态">
        <ListRow
          action={<Badge variant="ok">可用</Badge>}
          href="/settings/ai-provider"
          meta="LiteLLM/BYOK · 使用用户自己的 API Key"
          title="检查模型配置"
        />
      </Panel>

      <Panel title="最近练习">
        <div className="list">
          <ListRow
            action={<Badge variant="ok">已完成</Badge>}
            href="/practice/frontend-degrade/result"
            meta="选择题 · 已加入复习"
            title="接口超时降级方案"
          />
          <ListRow
            action={<Badge>下次复习</Badge>}
            href="/practice/performance-project"
            meta="问答题 · 待复述"
            title="首屏性能问题定位"
          />
        </div>
      </Panel>

      <Panel title="流程状态">
        <div className="question-grid">
          <QuestionCard action={<Badge variant="ok">生成完成</Badge>} source="AI 生成" title="候选题已生成" />
          <QuestionCard action={<Badge variant="ok">已入库</Badge>} source="题库" title="3 题可练习" />
          <QuestionCard action={<Badge>已练习</Badge>} source="复习" title="1 题等待回看" />
        </div>
      </Panel>

      <Panel title="候选题组" wide>
        <div className="question-grid">
          {candidateQuestions.map((question) => (
            <QuestionCard
              difficulty={question.difficulty}
              key={question.title}
              source={question.typeLabel}
              title={question.title}
              action={<ButtonLink href={`/questions/${question.id}`} neon={false} size="sm">查看详情</ButtonLink>}
            />
          ))}
        </div>
      </Panel>
    </main>
  );
}
