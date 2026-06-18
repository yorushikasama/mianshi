import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: Pick<PrismaService, "$queryRawUnsafe">) {}

  @Get()
  getHealth() {
    return {
      status: "ok",
      service: "ai-interview-prep-api",
    };
  }

  @Get("ready")
  async getReady() {
    try {
      await this.prisma.$queryRawUnsafe("SELECT 1");
      return {
        status: "ok",
        checks: {
          database: "ok",
        },
      };
    } catch {
      return {
        status: "degraded",
        checks: {
          database: "error",
        },
      };
    }
  }
}
