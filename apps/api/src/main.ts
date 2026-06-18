import "reflect-metadata";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { validateApiEnvironment } from "./config/environment";
import { ApiExceptionFilter } from "./http/api-exception.filter";
import { requestContextMiddleware } from "./http/request-context.middleware";

for (const envPath of [resolve(process.cwd(), ".env"), resolve(process.cwd(), "../../.env")]) {
  if (existsSync(envPath)) {
    loadEnv({ path: envPath });
  }
}

async function bootstrap() {
  const runtimeConfig = validateApiEnvironment();
  const app = await NestFactory.create(AppModule);

  app.use(requestContextMiddleware);
  app.useGlobalFilters(new ApiExceptionFilter());
  app.enableCors({
    origin: runtimeConfig.webOrigin,
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle("AI Interview Prep API")
    .setDescription("Java backend first-version interview preparation API")
    .setVersion("0.1.0")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  await app.listen(runtimeConfig.port);
}

void bootstrap();
