import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { createdAtMs, toIso, toPlain } from "@/lib/admin-serialize";
import { getAdminDb } from "@/lib/firebase-admin";
import type { CreateStoreProductInput, NaverSyncInfo, StoreProduct } from "@/lib/products";
import { isConditionGrade } from "@/types/product";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json({ ok: false, message: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  try {
    const snapshot = await getAdminDb().collection("products").get();
    const products = snapshot.docs
      .map((doc) => {
        const data = toPlain(doc.data()) as Omit<StoreProduct, "id">;
        return {
          id: doc.id,
          ...data,
          naverSync: data.naverSync ?? { status: "skipped" },
          createdAt: toIso(doc.get("createdAt")),
          updatedAt: toIso(doc.get("updatedAt")),
          _createdAtMs: createdAtMs(doc.get("createdAt")),
        };
      })
      .sort((a, b) => b._createdAtMs - a._createdAtMs)
      .map(({ _createdAtMs, ...product }) => product);

    return NextResponse.json({ ok: true, products, count: products.length });
  } catch (error) {
    console.error("[admin/products] failed to list products", error);
    return NextResponse.json(
      { ok: false, message: "상품 목록을 불러오지 못했어요." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json({ ok: false, message: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  let body: CreateStoreProductInput & { naverSync?: NaverSyncInfo };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, message: "요청 본문을 해석하지 못했어요." }, { status: 400 });
  }

  if (!body?.name?.trim() || !body?.brand?.trim()) {
    return NextResponse.json({ ok: false, message: "상품명과 브랜드는 필수입니다." }, { status: 400 });
  }
  if (!Number.isFinite(body.salePrice) || body.salePrice <= 0) {
    return NextResponse.json({ ok: false, message: "판매가는 0보다 커야 합니다." }, { status: 400 });
  }
  if (!Number.isInteger(body.stockQuantity) || body.stockQuantity <= 0) {
    return NextResponse.json(
      { ok: false, message: "재고 수량은 1 이상의 정수여야 합니다." },
      { status: 400 }
    );
  }
  if (body.retailPrice != null && (!Number.isFinite(body.retailPrice) || body.retailPrice < 0)) {
    return NextResponse.json(
      { ok: false, message: "정가는 0 이상의 숫자여야 합니다." },
      { status: 400 }
    );
  }
  if (!body.representativeImageUrl?.trim()) {
    return NextResponse.json({ ok: false, message: "대표 이미지가 필요합니다." }, { status: 400 });
  }
  if (body.isPreOwned && !isConditionGrade(body.condition)) {
    return NextResponse.json(
      { ok: false, message: "중고명품의 상태 등급을 선택해주세요." },
      { status: 400 }
    );
  }

  try {
    const { color, size, detailContent, naverSync, ...productInput } = body;
    const ref = await getAdminDb().collection("products").add({
      ...productInput,
      name: body.name.trim(),
      brand: body.brand.trim(),
      ...(color?.trim() ? { color: color.trim() } : {}),
      ...(size?.trim() ? { size: size.trim() } : {}),
      detailContent: detailContent?.trim() ?? "",
      ...(body.storeCategoryId ? { storeCategoryId: body.storeCategoryId } : {}),
      isPreOwned: Boolean(body.isPreOwned),
      ...(body.condition ? { condition: body.condition } : {}),
      todayShip: Boolean(body.todayShip),
      overseasShipping: Boolean(body.overseasShipping),
      optionalImageUrls: body.optionalImageUrls ?? [],
      optionalImages: body.optionalImages ?? [],
      variants: body.variants ?? [],
      retailPrice: body.retailPrice ?? null,
      naverSync: naverSync ?? { status: "skipped" },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    revalidateTag("products", "max");
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath(`/product/${ref.id}`);

    return NextResponse.json({ ok: true, id: ref.id });
  } catch (error) {
    console.error("[admin/products] failed to create product", error);
    return NextResponse.json(
      { ok: false, message: "상품을 저장하지 못했어요." },
      { status: 500 }
    );
  }
}
