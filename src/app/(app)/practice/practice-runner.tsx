"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/ui/form-field";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/shiny-button";
import { Panel } from "@/components/ui/panel";
import { Textarea } from "@/components/ui/textarea";
import { Toolbar } from "@/components/ui/toolbar";
import { cn } from "@/lib/utils";

type Question = {
  id: string;
  type: string;
  typeLabel: string;
  title: string;
  source: string;
  difficulty: string;
  answer?: string;
  answerOption?: string;
  options?: Array<{ key: string; text: string }>;
};

export function PracticeRunner({ question }: { question: Question }) {
  const [answer, setAnswer] = useState("我会先给出判断标准，再结合项目经历说明取舍...");
  const [selected, setSelected] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const isChoice = question.type === "single_choice";
  const isCorrect = selected === question.answerOption;

  function submit() {
    if (isChoice && !selected) return setError("请先选择一个答案");
    if (!isChoice && answer.trim().length === 0) return setError("请先输入你的回答");
    setError("");
    setSubmitted(true);
  }

  return (
    <main className="grid gap-[18px]">
      <Panel
        badge="按题练习"
        badgeVariant="hot"
        description={`${question.typeLabel} · ${question.difficulty} · ${question.source} · ${submitted ? "已提交" : "作答中"}`}
        title={question.title}
      >
        {isChoice ? (
          <RadioGroup
            aria-label="单选答案"
            disabled={submitted}
            onValueChange={setSelected}
            value={selected}
          >
            {(question.options ?? []).map((option) => (
              <div
                key={option.key}
                onClick={() => {
                  if (!submitted) setSelected(option.key);
                }}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-2xl border border-[#17151f14] bg-white/60 px-4 py-4 leading-[1.55] text-[#17151fc7] transition hover:border-[#17151f33] hover:bg-white",
                  selected === option.key && "border-[#17151f] bg-[#17151f08] text-[#17151f]"
                )}
              >
                <RadioGroupItem id={`${question.id}-${option.key}`} value={option.key} />
                <Label as="span" className="cursor-pointer text-base font-semibold leading-[1.55] text-inherit">
                  {option.key}. {option.text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        ) : (
          <>
            <FormField label="先写你的回答">
              <Textarea
                className="min-h-56 text-base leading-7"
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
              />
            </FormField>
            <details className="rounded-[18px] border border-[#17151f14] bg-white/50 px-4 py-3.5">
              <summary className="cursor-pointer font-black">显示参考答案</summary>
              <p className="mb-0">{question.answer}</p>
            </details>
          </>
        )}

        {submitted ? (
          <Toolbar>
            <Badge variant={isChoice ? (isCorrect ? "ok" : "hot") : "ok"}>
              {isChoice ? (isCorrect ? "回答正确" : "回答错误") : "已提交"}
            </Badge>
            <Button href={`/practice/${question.id}/result`} variant="solid">
              查看 AI 反馈
            </Button>
          </Toolbar>
        ) : (
          <div className="grid gap-2.5 border-t border-[#17151f12] pt-4">
            {error ? <p className="m-0 rounded-xl border border-red-300 bg-red-50 px-3 py-2.5 font-bold text-red-700">{error}</p> : null}
            <Toolbar>
              <Button onClick={submit} variant="solid">
                {isChoice ? "提交选择" : "提交回答"}
              </Button>
            </Toolbar>
          </div>
        )}
      </Panel>
    </main>
  );
}
