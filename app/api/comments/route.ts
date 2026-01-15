import { NextRequest, NextResponse } from "next/server";
import { addComment, listComments } from "@/lib/store";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) {
        return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    const comments = listComments(taskId);
    return NextResponse.json(comments);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { taskId, content, author } = body;

        if (!taskId || !content) {
            return NextResponse.json({ error: "taskId and content are required" }, { status: 400 });
        }

        const comment = addComment(taskId, content, author || "Anonymous");
        return NextResponse.json(comment);
    } catch (err) {
        return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
    }
}
