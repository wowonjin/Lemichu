import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import {
  defaultHomeCategories,
  mergeHomeCategories,
  type HomeCategoryContent,
  type HomeCategoryId,
} from "@/data/homeCategories";
import { getAdminDb } from "@/lib/firebase-admin";

async function loadHomeCategories(): Promise<HomeCategoryContent[]> {
  try {
    const snapshot = await getAdminDb().collection("homeCategories").get();
    const stored = snapshot.docs.map((categoryDoc) => ({
      id: categoryDoc.id,
      ...categoryDoc.data(),
    }));
    return mergeHomeCategories(stored);
  } catch {
    return defaultHomeCategories;
  }
}

const getCachedHomeCategories = unstable_cache(loadHomeCategories, ["home-categories"], {
  revalidate: 15,
  tags: ["home-categories"],
});

export const getAllHomeCategories = cache(async () => {
  return getCachedHomeCategories();
});

export const getPublishedHomeCategories = cache(async () => {
  const categories = await getAllHomeCategories();
  return categories.filter((category) => category.visible);
});

export const getHomeCategoryById = cache(async (id: string) => {
  const categories = await getCachedHomeCategories();
  return categories.find((category) => category.id === id);
});

export function isManagedHomeCategoryId(id: string): id is HomeCategoryId {
  return defaultHomeCategories.some((category) => category.id === id);
}
