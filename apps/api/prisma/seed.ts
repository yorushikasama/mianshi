import { PrismaClient } from "@prisma/client";
import { config as loadEnv } from "dotenv";
import {
  JAVA_BACKEND_CATEGORIES,
  JAVA_BACKEND_DOMAIN,
  JAVA_BACKEND_SEED_ANSWERS,
  JAVA_BACKEND_SEED_QUESTIONS,
} from "@mianshi/shared";
import { createPrismaClientOptions } from "../src/database/prisma-client-options";

loadEnv();

const prisma = new PrismaClient(createPrismaClientOptions());

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "seed@mianshi.local" },
    update: {},
    create: {
      id: "seed-user",
      email: "seed@mianshi.local",
      passwordHash: "seed-user-disabled",
      displayName: "默认练习用户",
    },
  });

  const domain = await prisma.domain.upsert({
    where: { slug: JAVA_BACKEND_DOMAIN.slug },
    update: {
      name: JAVA_BACKEND_DOMAIN.name,
      description: JAVA_BACKEND_DOMAIN.description,
    },
    create: {
      slug: JAVA_BACKEND_DOMAIN.slug,
      name: JAVA_BACKEND_DOMAIN.name,
      description: JAVA_BACKEND_DOMAIN.description,
    },
  });

  const categoryIdBySlug = new Map<string, string>();

  for (const category of JAVA_BACKEND_CATEGORIES) {
    const savedCategory = await prisma.category.upsert({
      where: {
        domainId_slug: {
          domainId: domain.id,
          slug: category.slug,
        },
      },
      update: {
        name: category.name,
        description: category.description,
        order: category.order,
      },
      create: {
        slug: category.slug,
        domainId: domain.id,
        name: category.name,
        description: category.description,
        order: category.order,
      },
    });

    categoryIdBySlug.set(category.slug, savedCategory.id);
  }

  for (const question of JAVA_BACKEND_SEED_QUESTIONS) {
    const categoryId = categoryIdBySlug.get(question.categorySlug);

    if (!categoryId) {
      throw new Error(`Missing category for seed question ${question.id}`);
    }

    await prisma.question.upsert({
      where: { id: question.id },
      update: {
        userId: null,
        domainId: domain.id,
        categoryId,
        title: question.title,
        content: question.content,
        type: question.type,
        difficulty: question.difficulty,
        sourceType: question.sourceType,
        aiGenerated: question.aiGenerated,
      },
      create: {
        id: question.id,
        userId: null,
        domainId: domain.id,
        categoryId,
        title: question.title,
        content: question.content,
        type: question.type,
        difficulty: question.difficulty,
        sourceType: question.sourceType,
        aiGenerated: question.aiGenerated,
      },
    });

    for (const tagName of question.tags) {
      const tag = await prisma.tag.upsert({
        where: { name: tagName },
        update: {},
        create: { name: tagName },
      });

      await prisma.questionTag.upsert({
        where: {
          questionId_tagId: {
            questionId: question.id,
            tagId: tag.id,
          },
        },
        update: {},
        create: {
          questionId: question.id,
          tagId: tag.id,
        },
      });
    }
  }

  for (const answer of JAVA_BACKEND_SEED_ANSWERS) {
    await prisma.answer.upsert({
      where: { id: answer.id },
      update: {
        answerType: answer.answerType,
        status: answer.status,
        content: answer.content,
        keyPoints: answer.keyPoints,
        model: answer.model,
        tokenUsage: answer.tokenUsage,
      },
      create: {
        id: answer.id,
        questionId: answer.questionId,
        answerType: answer.answerType,
        status: answer.status,
        content: answer.content,
        keyPoints: answer.keyPoints,
        model: answer.model,
        tokenUsage: answer.tokenUsage,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
