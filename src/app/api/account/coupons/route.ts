import { NextResponse } from "next/server";
import { accountErrorResponse, requireAccountActor } from "@/lib/account-request";
import { listUserCoupons } from "@/lib/member-account-admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await requireAccountActor(request);
    const items = await listUserCoupons(user.uid);
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    return accountErrorResponse(error, "쿠폰을 불러오지 못했어요.");
  }
}
