import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { listAdminOrders } from "@/lib/admin-orders-server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json({ ok: false, message: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  try {
    const orders = await listAdminOrders();
    return NextResponse.json({ ok: true, orders, count: orders.length });
  } catch (error) {
    console.error("[admin/orders] failed to list orders", error);
    return NextResponse.json(
      { ok: false, message: "주문 목록을 불러오지 못했어요." },
      { status: 500 }
    );
  }
}