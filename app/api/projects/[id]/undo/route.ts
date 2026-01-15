import { NextResponse } from "next/server";
import { undoLastAction } from "@/lib/store";

export async function POST(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const result = undoLastAction(params.id);

    if (!result.ok) {
        return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ message: result.message });
}
