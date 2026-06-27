import { NextResponse } from "next/server";
import {
  createAiProviderConfig,
  getActiveAiProviderConfig,
  listAiProviderConfigs,
  parseCreateAiProviderConfigInput
} from "@/lib/ai-provider-configs";
import { getUserSession } from "@/lib/server-session";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return jsonError("请先登录", 401);
  }

  const providers = await listAiProviderConfigs(session.user.id);
  return NextResponse.json({
    providers,
    activeProvider: await getActiveAiProviderConfig(session.user.id)
  });
}

export async function POST(request: Request) {
  const session = await getUserSession();
  if (!session) {
    return jsonError("请先登录", 401);
  }

  try {
    const input = parseCreateAiProviderConfigInput(await request.json());
    return NextResponse.json({ provider: await createAiProviderConfig(session.user.id, input) }, { status: 201 });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "保存失败");
  }
}
