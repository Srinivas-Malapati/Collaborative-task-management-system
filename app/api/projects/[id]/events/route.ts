import { NextResponse } from "next/server";
import { listProjectEvents } from "@/lib/store";

export async function GET(
  _req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const events = listProjectEvents(params.id);
  return NextResponse.json({ events });
}
