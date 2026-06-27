import { betterAuth } from "better-auth";
import { i18n } from "@better-auth/i18n";
import { nextCookies } from "better-auth/next-js";
import { emailOTP, username } from "better-auth/plugins";
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/mianshi";
const authSecret = process.env.BETTER_AUTH_SECRET;
const isProductionBuild = process.env.NEXT_PHASE === "phase-production-build";

if (process.env.NODE_ENV === "production" && !isProductionBuild && !authSecret) {
  throw new Error("Missing BETTER_AUTH_SECRET");
}

const db = new Kysely<never>({
  dialect: new PostgresDialect({
    pool: new Pool({ connectionString: databaseUrl })
  })
});

async function sendAuthCodeEmail({ email, otp, type }: { email: string; otp: string; type: string }) {
  const subject = type === "email-verification" ? "面试雷达邮箱验证码" : "面试雷达验证码";
  const text = `你的验证码是 ${otp}，10 分钟内有效。`;
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.info(`[auth] ${subject} for ${email}: ${otp}`);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: process.env.AUTH_EMAIL_FROM ?? "onboarding@resend.dev",
      to: email,
      subject,
      text
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to send auth email: ${response.status}`);
  }
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://127.0.0.1:3000",
  secret: authSecret ?? "dev-only-better-auth-secret-change-before-prod",
  database: {
    db,
    type: "postgres"
  },
  emailAndPassword: {
    enabled: true,
    async sendResetPassword({ url, user }) {
      console.info(`[auth] password reset for ${user.email}: ${url}`);
    }
  },
  emailVerification: {
    autoSignInAfterVerification: true
  },
  plugins: [
    username(),
    emailOTP({
      expiresIn: 600,
      sendVerificationOnSignUp: true,
      async sendVerificationOTP(data) {
        await sendAuthCodeEmail(data);
      }
    }),
    i18n({
      defaultLocale: "zh",
      translations: {
        zh: {
          EMAIL_NOT_VERIFIED: "请先验证邮箱后再登录",
          INVALID_EMAIL: "请输入正确的邮箱地址",
          INVALID_EMAIL_OR_PASSWORD: "邮箱或密码错误",
          INVALID_PASSWORD: "密码错误",
          INVALID_USERNAME: "用户名格式不正确",
          INVALID_USERNAME_OR_PASSWORD: "用户名或密码错误",
          PASSWORD_TOO_LONG: "密码太长",
          PASSWORD_TOO_SHORT: "密码至少需要 8 个字符",
          UNEXPECTED_ERROR: "系统开小差了，请稍后重试",
          USER_ALREADY_EXISTS: "这个账号已经存在",
          USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "这个邮箱已经注册过了",
          USERNAME_IS_ALREADY_TAKEN: "这个用户名已经被占用",
          USERNAME_TOO_LONG: "用户名太长",
          USERNAME_TOO_SHORT: "用户名至少需要 3 个字符"
        }
      }
    }),
    nextCookies()
  ]
});
