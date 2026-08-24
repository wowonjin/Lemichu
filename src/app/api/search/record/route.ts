import { NextResponse } from "next/server";
import { FirebaseAuthError, requireFirebaseUser } from "@/lib/firebase-admin";
import { recordCustomerSearchEvent } from "@/lib/search/record";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as {
      keyword?: unknown;
      source?: unknown;
      usedOnly?: unknown;
    } | null;

    let uid: string | null = null;
    try {
      const user = await requireFirebaseUser(req);
      uid = user.uid;
    } catch (error) {
      if (!(error instanceof FirebaseAuthError)) throw error;
    }

    const result = await recordCustomerSearchEvent({
      keyword: typeof body?.keyword === "string" ? body.keyword : "",
      source: body?.source,
      uid,
      usedOnly: Boolean(body?.usedOnly),
    });

    if (!result.ok) {
      return NextResponse.json({ message: "검색어가 올바르지 않습니다." }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[search] record failed", error);
    return NextResponse.json({ message: "검색어를 저장하지 못했어요." }, { status: 500 });
  }
}
