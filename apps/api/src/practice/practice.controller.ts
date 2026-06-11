import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ZodError } from "zod";
import { BearerAuthGuard } from "../auth/bearer-auth.guard";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { PracticeService } from "./practice.service";

@Controller("practice")
@UseGuards(BearerAuthGuard)
export class PracticeController {
  constructor(private readonly practiceService: PracticeService) {}

  @Get("attempts")
  listAttempts(@Req() request: AuthenticatedRequest, @Query("questionId") questionId?: string) {
    return this.practiceService.listAttempts(getCurrentUserId(request), questionId);
  }

  @Get("review-states/:questionId")
  async getReviewState(@Req() request: AuthenticatedRequest, @Param("questionId") questionId: string) {
    try {
      return await this.practiceService.getReviewState(getCurrentUserId(request), questionId);
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        throw new NotFoundException(error.message);
      }

      throw error;
    }
  }

  @Post("attempts")
  async submitAttempt(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    try {
      return await this.practiceService.submitAttempt(getCurrentUserId(request), body as never);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: "Invalid practice attempt",
          issues: error.issues,
        });
      }

      if (error instanceof Error && error.message.includes("not found")) {
        throw new NotFoundException(error.message);
      }

      throw error;
    }
  }
}

function getCurrentUserId(request: AuthenticatedRequest) {
  if (!request.user?.id) {
    throw new ForbiddenException("Authenticated user is required");
  }

  return request.user.id;
}
