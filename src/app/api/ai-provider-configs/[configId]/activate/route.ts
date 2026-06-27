import { NextResponse } from "next/server";
import { activateAiProviderConfig } from "@/lib/ai-provider-configs";
import { getUserSession } from "@/lib/server-session";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(_request: Request, { params }: { params: Promise<{ configId: string }> }) {
  const session = await getUserSession();
  if (!session) {
    return jsonError("请先登录", 401);
  }

  try {
    const { configId } = await params;
    return NextResponse.json({ provider: await activateAiProviderConfig(session.user.id, configId) });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "激活失败");
  }
}
