import {
  Brain,
  ChevronRight,
  ClipboardCheck,
  Radar,
  Route,
  ShieldCheck,
  Sparkles,
  Target,
  UploadCloud,
  Zap,
} from "lucide-react";
import { getJavaBackendCatalog } from "@mianshi/shared";
import { DashboardOverview } from "@/components/dashboard-overview";
import { HeroMotion } from "@/components/hero-motion";
import { QuestionCatalog } from "@/components/question-catalog";

const catalog = getJavaBackendCatalog();

const pipeline = [
  { label: "上传简历/JD", detail: "识别项目、岗位和经验层级", icon: UploadCloud },
  { label: "生成追问链", detail: "围绕 Java 后端高频场景追问", icon: Route },
  { label: "主动练习", detail: "隐藏答案后复述并提交", icon: Brain },
  { label: "FSRS 复习", detail: "按遗忘风险安排下次复习", icon: Target },
];

const customerReasons = [
  { title: "不是刷题库", detail: "围绕简历、JD 和项目经历生成最可能被问的问题。", icon: Target },
  { title: "不是看答案", detail: "每道题都要求主动复述，并给出评分、遗漏点和追问。", icon: ClipboardCheck },
  { title: "不是临时抱佛脚", detail: "FSRS 把答不稳的题重新排进复习计划。", icon: ShieldCheck },
];

export default function HomePage() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">
            <Radar size={20} strokeWidth={2.3} />
          </span>
          <span>面试雷达</span>
        </div>
        <nav className="topnav" aria-label="主导航">
          <a href="#plan">复习计划</a>
          <a href="#pipeline">AI 流程</a>
          <a href="#catalog">Java 知识树</a>
          <a href="/documents">资料库</a>
          <a href="/auth">登录</a>
          <a href="/practice/q_project_latency_optimization">开始练习</a>
        </nav>
      </header>

      <section className="hero-grid" aria-labelledby="page-title">
        <div className="hero-copy">
          <p className="eyebrow">Java 后端第一版 · PWA 学习工作台</p>
          <h1 id="page-title">把你的简历和 JD 变成一张面试作战图</h1>
          <p className="hero-text">
            面试雷达会把 Java 后端高频题、项目追问、AI 评分和 FSRS 复习排进同一个闭环。你练的不是题量，而是下一场面试最可能失分的地方。
          </p>
          <div className="hero-actions">
            <a className="primary-action" href="/practice/q_project_latency_optimization">
              <Sparkles size={18} />
              生成今日练习
            </a>
            <a className="secondary-action" href="/documents">
              接入简历/JD
              <ChevronRight size={17} />
            </a>
          </div>
        </div>

        <div className="hero-visual" aria-label="Java 后端面试雷达预览">
          <HeroMotion />
          <img src="/assets/images/java-knowledge-map.svg" alt="Java 后端知识图谱预览" />
        </div>

        <aside className="diagnosis-panel" aria-label="今日诊断">
          <div className="panel-heading">
            <Target size={18} />
            <span>今日面试风险</span>
          </div>
          <strong>项目追问表达不够闭环</strong>
          <p>建议优先练习“定位问题、技术方案、效果数据、权衡取舍”的四段式回答。</p>
          <div className="risk-meter" aria-label="风险等级 72%">
            <span style={{ width: "72%" }} />
          </div>
          <dl className="risk-facts">
            <div>
              <dt>预计耗时</dt>
              <dd>28 分钟</dd>
            </div>
            <div>
              <dt>优先级</dt>
              <dd>高</dd>
            </div>
          </dl>
        </aside>
      </section>

      <DashboardOverview categoryCount={catalog.categories.length} seedQuestionCount={catalog.questions.length} />

      <section className="reason-row" aria-label="选择面试雷达的理由">
        {customerReasons.map((item) => {
          const Icon = item.icon;
          return (
            <article className="reason-item" key={item.title}>
              <Icon size={20} />
              <h2>{item.title}</h2>
              <p>{item.detail}</p>
            </article>
          );
        })}
      </section>

      <section className="pipeline-section" id="pipeline" aria-labelledby="pipeline-title">
        <div className="section-title">
          <Zap size={20} />
          <h2 id="pipeline-title">从上传到复习的 AI 闭环</h2>
        </div>
        <div className="pipeline-grid">
          {pipeline.map((step, index) => {
            const Icon = step.icon;
            return (
              <article className="pipeline-step" key={step.label}>
                <span className="step-index">{String(index + 1).padStart(2, "0")}</span>
                <Icon size={20} />
                <h3>{step.label}</h3>
                <p>{step.detail}</p>
              </article>
            );
          })}
        </div>
      </section>

      <QuestionCatalog categories={catalog.categories} seedQuestions={catalog.questions} />

      <section className="practice-strip" id="practice">
        <div>
          <p className="eyebrow">下一步</p>
          <h2>上传简历或 JD 后，系统将生成个性化追问链</h2>
          <p>第一版先服务 Java 后端候选人，后续通过通用领域模型扩展到更多技术面试方向。</p>
        </div>
        <a className="practice-strip-action" href="/documents">
          <UploadCloud size={18} />
          上传资料
        </a>
      </section>
    </main>
  );
}
