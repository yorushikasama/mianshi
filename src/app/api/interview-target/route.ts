import { NextResponse } from "next/server";
import { getCurrentInterviewTarget, parseInterviewTargetInput, updateInterviewTarget } from "@/lib/interview-targets";
import { getUserSession } from "@/lib/server-session";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return jsonError("请先登录", 401);
  }

  return NextResponse.json({ interviewTarget: await getCurrentInterviewTarget(session.user.id) });
}

export async function PUT(request: Request) {
  const session = await getUserSession();
  if (!session) {
    return jsonError("请先登录", 401);
  }

  try {
    const input = parseInterviewTargetInput(await request.json());
    return NextResponse.json({ interviewTarget: await updateInterviewTarget(session.user.id, input) });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "保存失败");
  }
}
