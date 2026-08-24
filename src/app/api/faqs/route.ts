import { NextResponse } from "next/server";
import { listFaqs } from "@/lib/member-account-admin";

export const runtime = "nodejs";

export async function GET() {
  try {
    const items = await listFaqs(true);
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    console.error("[faqs] list failed", error);
    return NextResponse.json(
      { ok: false, message: "FAQ를 불러오지 못했어요." },
      { status: 500 }
    );
  }
}
