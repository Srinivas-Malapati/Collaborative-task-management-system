import { NextRequest, NextResponse } from "next/server";
import { subscribeToProject } from "@/lib/store";

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const projectId = params.id;

    const stream = new ReadableStream({
        start(controller) {
            const encoder = new TextEncoder();

            // Send initial connection message
            controller.enqueue(encoder.encode("event: connected\ndata: connected\n\n"));

            const callback = (type: string, data: any) => {
                const payload = JSON.stringify(data);
                controller.enqueue(encoder.encode(`event: ${type}\ndata: ${payload}\n\n`));
            };

            // Subscribe to store events
            const unsubscribe = subscribeToProject(projectId, callback);

            // Clean up on close (note: this might not fire immediately in all envs)
            request.signal.addEventListener("abort", () => {
                unsubscribe();
                try {
                    controller.close();
                } catch { }
            });
        },
    });

    return new NextResponse(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    });
}
