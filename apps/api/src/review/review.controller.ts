import { Controller, ForbiddenException, Get, Query, Req, UseGuards } from "@nestjs/common";
import { BearerAuthGuard } from "../auth/bearer-auth.guard";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { ReviewService } from "./review.service";

@Controller("review")
@UseGuards(BearerAuthGuard)
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get("overview")
  getOverview(@Req() request: AuthenticatedRequest, @Query() query: unknown) {
    return this.reviewService.getOverview(getCurrentUserId(request), query);
  }

  @Get("today")
  getToday(@Req() request: AuthenticatedRequest, @Query() query: unknown) {
    return this.reviewService.getToday(getCurrentUserId(request), query);
  }

  @Get("mistakes")
  getMistakes(@Req() request: AuthenticatedRequest, @Query() query: unknown) {
    return this.reviewService.getMistakes(getCurrentUserId(request), query);
  }
}

function getCurrentUserId(request: AuthenticatedRequest) {
  if (!request.user?.id) {
    throw new ForbiddenException("Authenticated user is required");
  }

  return request.user.id;
}
