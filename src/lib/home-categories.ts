import { adminRequestHeaders, assertApiOk } from "@/lib/admin-client";
import {
  defaultHomeCategories,
  mergeHomeCategories,
  type HomeCategoryContent,
} from "@/data/homeCategories";

async function adminCategoryFetch(init?: RequestInit) {
  return assertApiOk(
    await fetch("/api/admin/home-categories", {
      cache: "no-store",
      ...init,
      headers: {
        ...(await adminRequestHeaders()),
        ...(init?.headers ?? {}),
      },
    }),
    "카테고리를 처리하지 못했어요."
  );
}

export async function fetchHomeCategories(): Promise<HomeCategoryContent[]> {
  const json = await adminCategoryFetch();
  const categories = Array.isArray(json.categories) ? json.categories : [];
  return mergeHomeCategories(categories as Array<Record<string, unknown> & { id: string }>);
}

export async function saveHomeCategory(category: HomeCategoryContent) {
  await adminCategoryFetch({
    method: "PUT",
    body: JSON.stringify(category),
  });
}

export async function seedHomeCategories() {
  const json = await adminCategoryFetch({ method: "POST" });
  const categories = Array.isArray(json.categories) ? json.categories : defaultHomeCategories;
  return mergeHomeCategories(categories as Array<Record<string, unknown> & { id: string }>);
}
