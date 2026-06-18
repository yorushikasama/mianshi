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
import { AiJobService } from "./ai-job.service";

@Controller("ai/jobs")
@UseGuards(BearerAuthGuard)
export class AiJobController {
  constructor(private readonly aiJobService: AiJobService) {}

  @Post()
  async createJob(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    try {
      return await this.aiJobService.createJob(getCurrentUserId(request), body);
    } catch (error) {
      throw mapAiJobError(error);
    }
  }

  @Get()
  async listJobs(@Req() request: AuthenticatedRequest, @Query() query: unknown) {
    try {
      return await this.aiJobService.listJobs(getCurrentUserId(request), query);
    } catch (error) {
      throw mapAiJobError(error);
    }
  }

  @Get(":jobId")
  async getJob(@Req() request: AuthenticatedRequest, @Param("jobId") jobId: string) {
    try {
      return await this.aiJobService.getJob(getCurrentUserId(request), jobId);
    } catch (error) {
      throw mapAiJobError(error);
    }
  }
}

function getCurrentUserId(request: AuthenticatedRequest) {
  if (!request.user?.id) {
    throw new ForbiddenException("Authenticated user is required");
  }

  return request.user.id;
}

function mapAiJobError(error: unknown) {
  if (error instanceof ZodError) {
    return new BadRequestException({
      message: "Invalid AI job payload",
      issues: error.issues,
    });
  }

  if (error instanceof Error && error.message.includes("not found")) {
    return new NotFoundException(error.message);
  }

  if (error instanceof Error && error.message === "Daily AI job limit reached") {
    return new ForbiddenException(error.message);
  }

  return error;
}
