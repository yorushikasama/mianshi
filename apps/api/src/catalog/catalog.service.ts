import { Injectable } from "@nestjs/common";
import { getJavaBackendCatalog, JAVA_BACKEND_DOMAIN } from "@mianshi/shared";

@Injectable()
export class CatalogService {
  private readonly javaBackendCatalog = getJavaBackendCatalog();

  getDomains() {
    return [JAVA_BACKEND_DOMAIN];
  }

  getJavaBackendCatalog() {
    return this.javaBackendCatalog;
  }

  getJavaBackendQuestion(questionId: string) {
    return this.javaBackendCatalog.questions.find((question) => question.id === questionId);
  }

  getJavaBackendAnswerForQuestion(questionId: string) {
    return this.javaBackendCatalog.answers.find((answer) => answer.questionId === questionId);
  }
}
