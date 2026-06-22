import { practiceFeedback } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/shiny-button";
import { Panel } from "@/components/ui/panel";

export default function PracticeResultPage() {
  return (
    <main className="grid grid-cols-[minmax(0,1.04fr)_minmax(280px,0.42fr)] gap-[clamp(18px,2.5vw,28px)] max-[860px]:grid-cols-1">
      <Panel
        actions={<Button href="/practice" variant="solid">再练一次</Button>}
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
