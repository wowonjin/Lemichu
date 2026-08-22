import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { FirebaseAuthError, getAdminDb, requireFirebaseUser } from "@/lib/firebase-admin";
import {
  canManageHeaderBanner,
  DEFAULT_HEADER_BANNER,
  HEADER_BANNER_DOC_PATH,
  normalizeHeaderBanner,
} from "@/lib/headerBanner";

export const runtime = "nodejs";

function bannerDoc() {
  const [collectionName, documentId] = HEADER_BANNER_DOC_PATH;
  return getAdminDb().collection(collectionName).doc(documentId);
}

function errorResponse(error: unknown) {
  if (error instanceof FirebaseAuthError) {
    return NextResponse.json(
      { message: "관리자 로그인이 필요합니다." },
      { status: error.status }
    );
  }

  return NextResponse.json(
    { message: "상단 배너 설정을 처리하지 못했어요." },
    { status: 500 }
  );
}

export async function GET() {
  try {
    const snapshot = await bannerDoc().get();
    if (!snapshot.exists) {
      return NextResponse.json({ settings: DEFAULT_HEADER_BANNER, stored: false });
    }

    return NextResponse.json({
      settings: normalizeHeaderBanner(snapshot.data()),
      stored: true,
    });
  } catch {
    return NextResponse.json({ settings: DEFAULT_HEADER_BANNER, stored: false });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await requireFirebaseUser(req);
    if (!canManageHeaderBanner(user.email)) {
      return NextResponse.json({ message: "관리자만 수정할 수 있습니다." }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const settings = normalizeHeaderBanner(body);
    await bannerDoc().set({
      ...settings,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    return errorResponse(error);
  }
}
