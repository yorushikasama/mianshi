"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/ui/form-field";
import { Button, ButtonLink } from "@/components/ui/neon-button";
import { Panel } from "@/components/ui/panel";
import { Toolbar } from "@/components/ui/toolbar";

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
    <main className="page-stack">
      <Panel
        badge="按题练习"
        badgeVariant="hot"
        description={`${question.typeLabel} · ${question.source} · ${question.difficulty}`}
        title={question.title}
      >
        {isChoice ? (
          <div className="choice-list" aria-label="单选答案">
            {(question.options ?? []).map((option) => (
              <label key={option.key} className="choice-option">
                <input
                  checked={selected === option.key}
                  disabled={submitted}
                  name="mock-choice"
                  onChange={() => setSelected(option.key)}
                  type="radio"
                />
                <span>{option.key}. {option.text}</span>
              </label>
            ))}
          </div>
        ) : (
          <>
            <FormField label="先写你的回答">
              <textarea value={answer} onChange={(event) => setAnswer(event.target.value)} />
            </FormField>
            <details className="answer-preview">
              <summary>显示参考答案</summary>
              <p>{question.answer}</p>
            </details>
          </>
        )}

        {error ? <p className="form-error">{error}</p> : null}
        {submitted ? (
          <Toolbar>
            <Badge variant={isChoice ? (isCorrect ? "ok" : "hot") : "ok"}>
              {isChoice ? (isCorrect ? "回答正确" : "回答错误") : "已提交"}
            </Badge>
            <ButtonLink href={`/practice/${question.id}/result`} variant="solid">
              查看 AI 反馈
            </ButtonLink>
          </Toolbar>
        ) : (
          <Toolbar>
            <Button onClick={submit} variant="solid">
              {isChoice ? "提交选择" : "提交回答"}
            </Button>
          </Toolbar>
        )}
      </Panel>
    </main>
  );
}
