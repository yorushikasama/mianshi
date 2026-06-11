import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigin = process.env.WEB_ORIGIN ?? "http://localhost:3000";

  app.enableCors({
    origin: allowedOrigin,
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle("AI Interview Prep API")
    .setDescription("Java backend first-version interview preparation API")
    .setVersion("0.1.0")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
}

void bootstrap();
