import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { CatalogService } from "./catalog.service";

@Controller("catalog")
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get("domains")
  getDomains() {
    return this.catalogService.getDomains();
  }

  @Get("java-backend/categories")
  getJavaBackendCategories() {
    return this.catalogService.getJavaBackendCatalog().categories;
  }

  @Get("java-backend/questions")
  getJavaBackendQuestions() {
    return this.catalogService.getJavaBackendCatalog().questions;
  }

  @Get("java-backend/questions/:questionId")
  getJavaBackendQuestion(@Param("questionId") questionId: string) {
    const question = this.catalogService.getJavaBackendQuestion(questionId);

    if (!question) {
      throw new NotFoundException("Question not found");
    }

    return question;
  }

  @Get("java-backend/questions/:questionId/answer")
  getJavaBackendQuestionAnswer(@Param("questionId") questionId: string) {
    const answer = this.catalogService.getJavaBackendAnswerForQuestion(questionId);

    if (!answer) {
      throw new NotFoundException("Answer not found");
    }

    return answer;
  }
}
