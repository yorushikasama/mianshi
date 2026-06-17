"use client";

import { useEffect, useState } from "react";
import type { Category, Question } from "@mianshi/shared";
import { Layers } from "lucide-react";
import { ApiError, fetchQuestions } from "@/lib/api";
import { useAuth } from "./auth-provider";

interface QuestionCatalogProps {
  categories: Category[];
  seedQuestions: Question[];
}

export function QuestionCatalog({ categories, seedQuestions }: QuestionCatalogProps) {
  const { status } = useAuth();
  const [questions, setQuestions] = useState(seedQuestions);
  const [error, setError] = useState<string | null>(null);
  const isAuthenticated = status === "authenticated";

  useEffect(() => {
    let active = true;

    async function loadQuestions() {
      if (!isAuthenticated) {
        setQuestions(seedQuestions);
        setError(null);
        return;
      }

      try {
        const result = await fetchQuestions({ domainSlug: "java_backend", pageSize: 12 });
        if (active) {
          setQuestions(result.items.length > 0 ? result.items : seedQuestions);
          setError(null);
        }
      } catch (loadError) {
        if (active) {
          setQuestions(seedQuestions);
          setError(toErrorMessage(loadError));
        }
      }
    }

    if (status !== "loading") {
      void loadQuestions();
    }

    return () => {
      active = false;
    };
  }, [isAuthenticated, seedQuestions, status]);

  return (
    <section className="catalog-section" id="catalog">
      <div className="section-block">
        <div className="catalog-heading">
          <div className="section-title">
            <Layers size={20} />
            <h2>Java 后端题库</h2>
          </div>
          <span>{isAuthenticated ? "服务器题库" : "种子题预览"}</span>
        </div>

        {error ? <p className="catalog-note">服务器题库暂时不可用，已显示本地种子题。</p> : null}

        <div className="task-list">
          {questions.slice(0, 6).map((question) => (
            <article className="task-item" key={question.id}>
              <div>
                <span className={`difficulty ${question.difficulty}`}>{question.difficulty}</span>
                <h3>{question.title}</h3>
                <p>{question.content}</p>
              </div>
              <a className="task-button" href={`/practice/${encodeURIComponent(question.id)}`}>
                开始练习
              </a>
            </article>
          ))}
        </div>

        <div className="section-title catalog-tree-title">
          <Layers size={20} />
          <h2>Java 后端知识树</h2>
        </div>
        <div className="category-grid">
          {categories.map((category) => (
            <article className="category-node" key={category.slug}>
              <span>{String(category.order + 1).padStart(2, "0")}</span>
              <h3>{category.name}</h3>
              <p>{category.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function toErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return `${error.message} (${error.status})`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "题库加载失败";
}
