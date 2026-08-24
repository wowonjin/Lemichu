import { NextResponse } from "next/server";
import { incrementProductSignal } from "@/lib/product-signals-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let productId = "";
  let delta = 0;

  try {
    const body = (await request.json()) as { productId?: string; delta?: number };
    productId = String(body.productId ?? "").trim();
    delta = Number(body.delta);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!productId || (delta !== 1 && delta !== -1)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    await incrementProductSignal(productId, "wishCount", delta);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[product-signals] failed to increment wish", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
