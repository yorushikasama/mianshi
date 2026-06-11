import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { RegisterServiceWorker } from "@/components/register-service-worker";

export const metadata: Metadata = {
  title: "面试雷达 | Java 后端 AI 复习",
  description: "面向 Java 后端候选人的 AI 面试复习 Web/PWA 平台",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#101820",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <AuthProvider>
          <RegisterServiceWorker />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
