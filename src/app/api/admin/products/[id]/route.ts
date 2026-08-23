import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const ADMIN_EMAIL = "admin@gmail.com";

function isAdminEmail(email: string | undefined | null) {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const tempAdminEmail = process.env.LEMICHU_ADMIN_EMAIL?.trim().toLowerCase();
  return normalized === ADMIN_EMAIL || (tempAdminEmail ? normalized === tempAdminEmail : false);
}

async function verifyAdmin(request: Request): Promise<boolean> {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];

  if (token) {
    try {
      const decoded = await getAdminAuth().verifyIdToken(token);
      return isAdminEmail(decoded.email);
    } catch {
      return false;
    }
  }

  // Fallback for the temp-admin session which has no Firebase ID token.
  return isAdminEmail(request.headers.get("x-admin-email"));
}

type UpdatePayload = {
  name?: string;
  brand?: string;
  salePrice?: number;
  retailPrice?: number | null;
  color?: string;
  size?: string;
  detailContent?: string;
};

const stringFields = ["name", "brand", "color", "size", "detailContent"] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json(
      { ok: false, message: "관리자 권한이 필요합니다." },
      { status: 403 }
    );
  }

  const { id } = await params;

  let payload: UpdatePayload;
  try {
    payload = (await request.json()) as UpdatePayload;
  } catch {
    return NextResponse.json(
      { ok: false, message: "요청 본문(JSON)을 해석하지 못했습니다." },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {};

  for (const field of stringFields) {
    const value = payload[field];
    if (typeof value === "string") {
      if (!value.trim() && (field === "name" || field === "brand")) {
        return NextResponse.json(
          { ok: false, message: `${field === "name" ? "상품명" : "브랜드"}은 비울 수 없습니다.` },
          { status: 400 }
        );
      }
      updates[field] = value.trim();
    }
  }

  if (payload.salePrice !== undefined) {
    const salePrice = Number(payload.salePrice);
    if (!Number.isFinite(salePrice) || salePrice < 0) {
      return NextResponse.json(
        { ok: false, message: "판매가는 0 이상의 숫자여야 합니다." },
        { status: 400 }
      );
    }
    updates.salePrice = Math.round(salePrice);
  }

  if (payload.retailPrice !== undefined) {
    if (payload.retailPrice === null) {
      updates.retailPrice = null;
    } else {
      const retailPrice = Number(payload.retailPrice);
      if (!Number.isFinite(retailPrice) || retailPrice < 0) {
        return NextResponse.json(
          { ok: false, message: "정가는 0 이상의 숫자여야 합니다." },
          { status: 400 }
        );
      }
      updates.retailPrice = Math.round(retailPrice);
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { ok: false, message: "수정할 항목이 없습니다." },
      { status: 400 }
    );
  }

  try {
    const docRef = getAdminDb().collection("products").doc(id);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      return NextResponse.json(
        { ok: false, message: "상품을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    await docRef.update({
      ...updates,
      updatedAt: FieldValue.serverTimestamp(),
    });

    revalidateTag("products");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/products] failed to update product", error);
    return NextResponse.json(
      { ok: false, message: "상품 저장 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
