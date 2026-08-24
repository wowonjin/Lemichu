import { NextResponse } from "next/server";
import { incrementProductSignal } from "@/lib/product-signals-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let productId = "";
  try {
    const body = (await request.json()) as { productId?: string };
    productId = String(body.productId ?? "").trim();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!productId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    await incrementProductSignal(productId, "viewCount", 1);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[product-signals] failed to increment view", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
