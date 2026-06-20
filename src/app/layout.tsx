import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "面试雷达",
  description: "二次元风格的 AI 面试训练工作台"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
