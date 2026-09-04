import { adminRequestHeaders, assertApiOk } from "@/lib/admin-client";
import type { OrderStatus, PurchaseOrder } from "@/lib/orders";
import type { StoreProduct } from "@/lib/products";

export type AdminUserProfile = {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  provider: "email" | "google" | "naver" | "kakao";
  role: "admin" | "member";
  photoURL?: string | null;
  points?: number;
  grade?: string;
  createdAt?: string | null;
  lastLoginAt?: string | null;
  updatedAt?: string | null;
};

export async function fetchAdminUsers() {
  const json = await assertApiOk(
    await fetch("/api/admin/users", {
      cache: "no-store",
      headers: await adminRequestHeaders(),
    }),
    "회원 목록을 불러오지 못했어요."
  );

  return (Array.isArray(json.users) ? json.users : []) as AdminUserProfile[];
}

export async function fetchAdminOrders() {
  const json = await assertApiOk(
    await fetch("/api/admin/orders", {
      cache: "no-store",
      headers: await adminRequestHeaders(),
    }),
    "주문 목록을 불러오지 못했어요."
  );

  return (Array.isArray(json.orders) ? json.orders : []) as PurchaseOrder[];
}

export async function fetchAdminProducts() {
  const json = await assertApiOk(
    await fetch("/api/admin/products", {
      cache: "no-store",
      headers: await adminRequestHeaders(),
    }),
    "상품 목록을 불러오지 못했어요."
  );

  return (Array.isArray(json.products) ? json.products : []) as StoreProduct[];
}

export async function updateAdminOrderStatus(
  orderId: string,
  status: OrderStatus,
  delivery?: { courier?: string; invoiceNo?: string }
) {
  const json = await assertApiOk(
    await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: await adminRequestHeaders(),
      body: JSON.stringify({ status, delivery }),
    }),
    "주문 상태를 변경하지 못했어요."
  );
  return {
    status: (typeof json.status === "string" ? json.status : status) as OrderStatus,
    paymentStatus:
      typeof json.paymentStatus === "string"
        ? (json.paymentStatus as PurchaseOrder["paymentStatus"])
        : undefined,
  };
}
