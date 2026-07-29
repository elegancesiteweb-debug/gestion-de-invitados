import { NextRequest, NextResponse } from "next/server";
import { sendRemindersForAllEvents } from "@/lib/reminders";

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const result = await sendRemindersForAllEvents();
  return NextResponse.json(result);
}
