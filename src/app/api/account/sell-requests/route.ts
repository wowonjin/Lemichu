import { NextResponse } from "next/server";
import { accountErrorResponse, requireAccountActor } from "@/lib/account-request";
import { createSellRequest, listSellRequests } from "@/lib/member-account-admin";
import { SELL_KINDS, type SellKind } from "@/lib/member-account";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await requireAccountActor(request);
    return NextResponse.json({ ok: true, items: await listSellRequests(user.uid) });
  } catch (error) {
    return accountErrorResponse(error, "판매 내역을 불러오지 못했어요.");
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAccountActor(request);
    const body = (await request.json().catch(() => null)) as {
      kind?: SellKind;
      brand?: string;
      itemName?: string;
      condition?: string;
      note?: string;
    } | null;

    const id = await createSellRequest({
      userId: user.uid,
      userEmail: user.email,
      userName: user.name,
      kind: SELL_KINDS.includes(body?.kind as SellKind) ? (body?.kind as SellKind) : "sell",
      brand: String(body?.brand ?? ""),
      itemName: String(body?.itemName ?? ""),
      condition: String(body?.condition ?? ""),
      note: body?.note,
    });

    return NextResponse.json({ ok: true, id });
  } catch (error) {
    return accountErrorResponse(error, "판매 신청을 등록하지 못했어요.");
  }
}
