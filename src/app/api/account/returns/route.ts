import { NextResponse } from "next/server";
import { accountErrorResponse, requireAccountActor } from "@/lib/account-request";
import { createReturnRequest, listReturnRequests } from "@/lib/member-account-admin";
import { RETURN_TYPES, type ReturnType } from "@/lib/member-account";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await requireAccountActor(request);
    return NextResponse.json({ ok: true, items: await listReturnRequests(user.uid) });
  } catch (error) {
    return accountErrorResponse(error, "신청 내역을 불러오지 못했어요.");
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAccountActor(request);
    const body = (await request.json().catch(() => null)) as {
      orderId?: string;
      type?: ReturnType;
      reason?: string;
    } | null;

    const id = await createReturnRequest({
      userId: user.uid,
      userEmail: user.email,
      userName: user.name,
      orderId: String(body?.orderId ?? ""),
      type: RETURN_TYPES.includes(body?.type as ReturnType) ? (body?.type as ReturnType) : "return",
      reason: String(body?.reason ?? ""),
    });

    return NextResponse.json({ ok: true, id });
  } catch (error) {
    return accountErrorResponse(error, "취소·교환·반품을 신청하지 못했어요.");
  }
}
