import { NextResponse } from "next/server";
import { finalizePendingEvents } from "@/lib/store";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;

  if (expected && authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const finalizedCount = finalizePendingEvents(3);
  return NextResponse.json({ ok: true, finalizedCount });
}
