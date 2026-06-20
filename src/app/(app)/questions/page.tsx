import { candidateQuestions } from "@/lib/mock-data";
import { QuestionsList } from "./questions-list";

export default function QuestionsPage() {
  return <QuestionsList questions={candidateQuestions} />;
}
