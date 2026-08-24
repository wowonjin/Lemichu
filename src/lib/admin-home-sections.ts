import { getFirebaseIdToken, readAuthUser } from "@/lib/auth";
import type { AlgorithmDoc } from "@/lib/home-algorithms";
import type { MerchProductCard } from "@/lib/home-merchandising";
import type { HomeSectionId, HomeSlotMode } from "@/lib/home-sections";

export type AdminHomeSlot = {
  key: string;
  label: string;
  hint: string;
  limit: number;
  visibleOnHome: number;
  slotId: string;
  mode: HomeSlotMode;
  autoItems: MerchProductCard[];
  resolvedItems: MerchProductCard[];
};

export type AdminHomeSection = {
  id: HomeSectionId;
  title: string;
  homeTitle: string;
  description: string;
  algorithm: AlgorithmDoc;
  slots: AdminHomeSlot[];
};

export type AdminHomeSectionsPayload = {
  sections: AdminHomeSection[];
  catalog: MerchProductCard[];
};

async function adminHeaders() {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = await getFirebaseIdToken().catch(() => null);
  const user = readAuthUser();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (user?.email) headers["x-admin-email"] = user.email;
  return headers;
}

export async function fetchAdminHomeSections(): Promise<AdminHomeSectionsPayload> {
  const response = await fetch("/api/admin/home-sections", {
    headers: await adminHeaders(),
    cache: "no-store",
  });
  const result = (await response.json()) as AdminHomeSectionsPayload & {
    ok?: boolean;
    message?: string;
  };
  if (!response.ok || !result.ok) {
    throw new Error(result.message ?? "홈 섹션을 불러오지 못했어요.");
  }
  return { sections: result.sections, catalog: result.catalog };
}

export async function saveAdminHomeSlot(input: {
  sectionId: HomeSectionId;
  slotKey: string;
  mode: HomeSlotMode;
  productIds: string[];
}) {
  const response = await fetch("/api/admin/home-sections", {
    method: "PUT",
    headers: await adminHeaders(),
    body: JSON.stringify(input),
  });
  const result = (await response.json()) as { ok?: boolean; message?: string };
  if (!response.ok || !result.ok) {
    throw new Error(result.message ?? "홈 섹션을 저장하지 못했어요.");
  }
}
