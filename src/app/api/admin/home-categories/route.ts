import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { verifyAdminRequest } from "@/lib/admin-auth";
import {
  HOME_CATEGORY_COLLECTION,
  defaultHomeCategories,
  mergeHomeCategories,
  type HomeCategoryContent,
} from "@/data/homeCategories";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

function toPayload(category: HomeCategoryContent) {
  return {
    label: category.label,
    href: category.href,
    hint: category.hint,
    description: category.description,
    imageSrc: category.imageSrc,
    visible: category.visible,
    order: category.order,
    items: category.items,
  };
}

async function listCategories() {
  const snapshot = await getAdminDb().collection(HOME_CATEGORY_COLLECTION).get();
  const stored = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  return mergeHomeCategories(stored);
}

export async function GET(request: Request) {
  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json({ ok: false, message: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  try {
    const categories = await listCategories();
    return NextResponse.json({ ok: true, categories, count: categories.length });
  } catch (error) {
    console.error("[admin/home-categories] failed to list", error);
    return NextResponse.json(
      { ok: false, message: "카테고리를 불러오지 못했어요." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json({ ok: false, message: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  let category: HomeCategoryContent;
  try {
    category = (await request.json()) as HomeCategoryContent;
  } catch {
    return NextResponse.json({ ok: false, message: "요청 본문을 해석하지 못했어요." }, { status: 400 });
  }

  if (!category?.id) {
    return NextResponse.json({ ok: false, message: "카테고리 정보가 올바르지 않아요." }, { status: 400 });
  }

  try {
    await getAdminDb()
      .collection(HOME_CATEGORY_COLLECTION)
      .doc(category.id)
      .set(
        {
          ...toPayload(category),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    revalidateTag("home-categories", "max");
    return NextResponse.json({ ok: true, categories: await listCategories() });
  } catch (error) {
    console.error("[admin/home-categories] failed to save", error);
    return NextResponse.json(
      { ok: false, message: "카테고리를 저장하지 못했어요." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json({ ok: false, message: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  try {
    const db = getAdminDb();
    const snapshot = await db.collection(HOME_CATEGORY_COLLECTION).get();
    const existingIds = new Set(snapshot.docs.map((doc) => doc.id));
    const missing =
      snapshot.empty
        ? defaultHomeCategories
        : defaultHomeCategories.filter((category) => !existingIds.has(category.id));

    if (missing.length > 0) {
      const batch = db.batch();
      for (const category of missing) {
        batch.set(db.collection(HOME_CATEGORY_COLLECTION).doc(category.id), {
          ...toPayload(category),
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      await batch.commit();
      revalidateTag("home-categories", "max");
    }

    return NextResponse.json({ ok: true, categories: await listCategories() });
  } catch (error) {
    console.error("[admin/home-categories] failed to seed", error);
    return NextResponse.json(
      { ok: false, message: "기본 카테고리를 넣지 못했어요." },
      { status: 500 }
    );
  }
}
