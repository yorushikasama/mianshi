import { practiceFeedback } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/neon-button";
import { Panel } from "@/components/ui/panel";

export default function PracticeResultPage() {
  return (
    <main className="page-grid">
      <Panel
        actions={<ButtonLink href="/practice" variant="solid">再练一次</ButtonLink>}
        badge="练习结果"
        badgeVariant="hot"
        description={practiceFeedback.question}
        title={`${practiceFeedback.score} 分`}
      >
        <p>{practiceFeedback.suggestion}</p>
      </Panel>

      <Panel title="遗漏点">
        <ul>
          {practiceFeedback.missing.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Panel>

      <Panel title="追问风险">
        <ul>
          {practiceFeedback.followups.map((item) => (
            <li key={item}>
              <Badge>{item}</Badge>
            </li>
          ))}
        </ul>
      </Panel>
    </main>
  );
}
