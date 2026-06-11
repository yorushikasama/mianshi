import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post, Query } from "@nestjs/common";
import { ZodError } from "zod";
import { PracticeService } from "./practice.service";

@Controller("practice")
export class PracticeController {
  constructor(private readonly practiceService: PracticeService) {}

  @Get("attempts")
  listAttempts(@Query("questionId") questionId?: string) {
    return this.practiceService.listAttempts(questionId);
  }

  @Get("review-states/:questionId")
  async getReviewState(@Param("questionId") questionId: string) {
    try {
      return await this.practiceService.getReviewState(questionId);
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        throw new NotFoundException(error.message);
      }

      throw error;
    }
  }

  @Post("attempts")
  async submitAttempt(@Body() body: unknown) {
    try {
      return await this.practiceService.submitAttempt(body as never);
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
