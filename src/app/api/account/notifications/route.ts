import { NextResponse } from "next/server";
import { accountErrorResponse, requireAccountActor } from "@/lib/account-request";
import { listNotifications, markNotificationsRead } from "@/lib/member-account-admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await requireAccountActor(request);
    return NextResponse.json({ ok: true, items: await listNotifications(user.uid) });
  } catch (error) {
    return accountErrorResponse(error, "알림을 불러오지 못했어요.");
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireAccountActor(request);
    const body = (await request.json().catch(() => null)) as { ids?: string[] } | null;
    const count = await markNotificationsRead(user.uid, body?.ids);
    return NextResponse.json({ ok: true, count });
  } catch (error) {
    return accountErrorResponse(error, "알림을 확인하지 못했어요.");
  }
}
