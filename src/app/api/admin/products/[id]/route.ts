import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { getAdminDb } from "@/lib/firebase-admin";
import type { ProductImageAsset } from "@/lib/product-images";
import { isConditionGrade, type ConditionGrade } from "@/types/product";

export const runtime = "nodejs";

type UpdatePayload = {
  name?: string;
  brand?: string;
  salePrice?: number;
  retailPrice?: number | null;
  color?: string;
  size?: string;
  detailContent?: string;
  stockQuantity?: number;
  storeCategoryId?: string;
  isPreOwned?: boolean;
  condition?: ConditionGrade | null;
  todayShip?: boolean;
  representativeImageUrl?: string;
  optionalImageUrls?: string[];
  representativeImage?: ProductImageAsset;
  optionalImages?: ProductImageAsset[];
};

const stringFields = ["name", "brand", "color", "size", "detailContent"] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdminRequest(request))) {
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

  if (payload.stockQuantity !== undefined) {
    const stockQuantity = Number(payload.stockQuantity);
    if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
      return NextResponse.json(
        { ok: false, message: "재고 수량은 0 이상의 정수여야 합니다." },
        { status: 400 }
      );
    }
    updates.stockQuantity = stockQuantity;
  }

  if (payload.storeCategoryId !== undefined) {
    updates.storeCategoryId = payload.storeCategoryId.trim() || FieldValue.delete();
  }

  if (payload.isPreOwned !== undefined) {
    updates.isPreOwned = Boolean(payload.isPreOwned);
    if (!payload.isPreOwned) updates.condition = FieldValue.delete();
  }

  if (payload.condition !== undefined && payload.condition !== null) {
    if (!isConditionGrade(payload.condition)) {
      return NextResponse.json(
        { ok: false, message: "상품 상태 등급이 올바르지 않습니다." },
        { status: 400 }
      );
    }
    updates.condition = payload.condition;
  }

  if (payload.todayShip !== undefined) {
    updates.todayShip = Boolean(payload.todayShip);
  }

  if (payload.representativeImage !== undefined) {
    if (
      !payload.representativeImage?.original?.url ||
      !payload.representativeImageUrl?.trim()
    ) {
      return NextResponse.json(
        { ok: false, message: "대표 이미지 정보가 올바르지 않습니다." },
        { status: 400 }
      );
    }
    updates.representativeImage = payload.representativeImage;
    updates.representativeImageUrl = payload.representativeImageUrl.trim();
  }

  if (payload.optionalImages !== undefined || payload.optionalImageUrls !== undefined) {
    if (!Array.isArray(payload.optionalImages) || !Array.isArray(payload.optionalImageUrls)) {
      return NextResponse.json(
        { ok: false, message: "추가 이미지 정보가 올바르지 않습니다." },
        { status: 400 }
      );
    }
    updates.optionalImages = payload.optionalImages;
    updates.optionalImageUrls = payload.optionalImageUrls;
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

    revalidateTag("products", "max");
    revalidatePath(`/product/${id}`);
    revalidatePath("/");
    revalidatePath("/products");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/products] failed to update product", error);
    return NextResponse.json(
      { ok: false, message: "상품 저장 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json(
      { ok: false, message: "관리자 권한이 필요합니다." },
      { status: 403 }
    );
  }

  const { id } = await params;

  try {
    const docRef = getAdminDb().collection("products").doc(id);
    const snapshot = await docRef.get();
    if (!snapshot.exists) {
      return NextResponse.json(
        { ok: false, message: "상품을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    await docRef.delete();
    revalidateTag("products", "max");
    revalidatePath(`/product/${id}`);
    revalidatePath("/");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/products] failed to delete product", error);
    return NextResponse.json(
      { ok: false, message: "상품을 삭제하지 못했어요." },
      { status: 500 }
    );
  }
}
