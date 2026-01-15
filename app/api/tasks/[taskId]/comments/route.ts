import { NextResponse } from "next/server";
import { addComment, listComments } from "@/lib/store";

export async function GET(
  _req: Request,
  props: { params: Promise<{ taskId: string }> }
) {
  const params = await props.params;
  const comments = listComments(params.taskId);
  return NextResponse.json({ comments });
}

export async function POST(
  req: Request,
  props: { params: Promise<{ taskId: string }> }
) {
  const params = await props.params;
  const body = await req.json().catch(() => null);
  const content = (body?.content ?? "").trim();
  const author = (body?.author ?? "Anonymous").trim();

  if (!content) {
    return NextResponse.json({ error: "Comment content required" }, { status: 400 });
  }

  const comment = addComment(params.taskId, content, author);
  return NextResponse.json({ comment }, { status: 201 });
}
