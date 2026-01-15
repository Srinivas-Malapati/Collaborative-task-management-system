import { NextResponse } from "next/server";
import { getTasksByProject } from "@/lib/store";

export async function GET(
  _req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const tasks = getTasksByProject(params.id);
  return NextResponse.json({ tasks });
}
