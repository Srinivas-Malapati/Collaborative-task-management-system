import { NextResponse } from "next/server";
import { createTask } from "@/lib/store";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip)) {
        return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    try {
        const body = await request.json();
        const { projectId, title, description, assignedTo, priority, dependencies } = body;

        if (!projectId || !title) {
            return NextResponse.json(
                { error: "projectId and title are required" },
                { status: 400 }
            );
        }

        const newTask = createTask(
            projectId,
            title,
            description || "",
            assignedTo || [],
            priority || "medium",
            dependencies || []
        );

        return NextResponse.json(newTask, { status: 201 });
    } catch (error) {
        console.error("Error creating task:", error);
        return NextResponse.json(
            { error: "Failed to create task" },
            { status: 500 }
        );
    }
}
