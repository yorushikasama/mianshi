import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ZodError } from "zod";
import { BearerAuthGuard } from "../auth/bearer-auth.guard";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { QuestionService } from "./question.service";

@Controller("questions")
@UseGuards(BearerAuthGuard)
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Get()
  listQuestions(@Req() request: AuthenticatedRequest, @Query() query: unknown) {
    return this.questionService.listQuestions(getCurrentUserId(request), query);
  }

  @Get(":questionId")
  async getQuestion(@Req() request: AuthenticatedRequest, @Param("questionId") questionId: string) {
    try {
      return await this.questionService.getQuestion(getCurrentUserId(request), questionId);
    } catch (error) {
      throw mapQuestionError(error);
    }
  }

  @Get(":questionId/answer")
  async getQuestionAnswer(@Req() request: AuthenticatedRequest, @Param("questionId") questionId: string) {
    try {
      return await this.questionService.getQuestionAnswer(getCurrentUserId(request), questionId);
    } catch (error) {
      throw mapQuestionError(error);
    }
  }

  @Post()
  async createQuestion(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    try {
      return await this.questionService.createQuestion(getCurrentUserId(request), body);
    } catch (error) {
      throw mapQuestionError(error);
    }
  }

  @Patch(":questionId")
  async updateQuestion(
    @Req() request: AuthenticatedRequest,
    @Param("questionId") questionId: string,
    @Body() body: unknown,
  ) {
    try {
      return await this.questionService.updateQuestion(getCurrentUserId(request), questionId, body);
    } catch (error) {
      throw mapQuestionError(error);
    }
  }

  @Delete(":questionId")
  async deleteQuestion(@Req() request: AuthenticatedRequest, @Param("questionId") questionId: string) {
    try {
      await this.questionService.deleteQuestion(getCurrentUserId(request), questionId);
      return { deleted: true };
    } catch (error) {
      throw mapQuestionError(error);
    }
  }
}

function getCurrentUserId(request: AuthenticatedRequest) {
  if (!request.user?.id) {
    throw new ForbiddenException("Authenticated user is required");
  }

  return request.user.id;
}

function mapQuestionError(error: unknown) {
  if (error instanceof ZodError) {
    return new BadRequestException({
      message: "Invalid question payload",
      issues: error.issues,
    });
  }

  if (error instanceof Error && error.message.includes("not found")) {
    return new NotFoundException(error.message);
  }

  if (error instanceof Error && error.message.includes("not editable")) {
    return new ForbiddenException(error.message);
  }

  return error;
}
