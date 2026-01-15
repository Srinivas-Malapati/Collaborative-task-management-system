import { NextResponse } from "next/server";
import { updateTaskStatus } from "@/lib/store";
import type { TaskStatus } from "@/lib/types";

import { checkRateLimit } from "@/lib/rate-limit";

export async function PATCH(
  req: Request,
  props: { params: Promise<{ taskId: string }> }
) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const params = await props.params;
  const body = await req.json().catch(() => null);
  const status = body?.status as TaskStatus | undefined;

  if (!status) {
    return NextResponse.json({ error: "Missing status" }, { status: 400 });
  }

  const result = updateTaskStatus(params.taskId, status);

  if (!result.ok) {
    const isBlocked = result.error.startsWith("Blocked:");
    return NextResponse.json(
      { error: result.error, task: result.task },
      { status: isBlocked ? 409 : 404 }
    );
  }

  return NextResponse.json({ task: result.task });
}
