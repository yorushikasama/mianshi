import { BadRequestException, Body, Controller, ForbiddenException, Get, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ZodError } from "zod";
import { BearerAuthGuard } from "../auth/bearer-auth.guard";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { DocumentService } from "./document.service";

@Controller("documents")
@UseGuards(BearerAuthGuard)
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post()
  async createDocument(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    try {
      return await this.documentService.createDocument(getCurrentUserId(request), body);
    } catch (error) {
      throw mapDocumentError(error);
    }
  }

  @Get()
  async listDocuments(@Req() request: AuthenticatedRequest, @Query() query: unknown) {
    try {
      return await this.documentService.listDocuments(getCurrentUserId(request), query);
    } catch (error) {
      throw mapDocumentError(error);
    }
  }
}

function getCurrentUserId(request: AuthenticatedRequest) {
  if (!request.user?.id) {
    throw new ForbiddenException("Authenticated user is required");
  }

  return request.user.id;
}

function mapDocumentError(error: unknown) {
  if (error instanceof ZodError) {
    return new BadRequestException({
      message: "Invalid document payload",
      issues: error.issues,
    });
  }

  return error;
}
