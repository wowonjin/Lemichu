import { accountRequestHeaders, adminRequestHeaders, assertApiOk } from "@/lib/admin-client";
import type { NotificationSettings, SavedAddress } from "@/lib/accountStorage";
import type {
  CouponTemplate,
  MemberFaq,
  MemberGrade,
  MemberNotification,
  MemberNotificationKind,
  ReturnRequest,
  ReturnStatus,
  ReturnType,
  SellKind,
  SellRequest,
  SellStatus,
  UserCoupon,
} from "@/lib/member-account";
import type {
  LogiiImportReport,
  LogiiShipmentRecord,
} from "@/lib/logii-delivery";

type ApiList<T> = { items?: T[] };

async function accountFetch(path: string, init?: RequestInit) {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(await accountRequestHeaders()),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  return response;
}

async function adminFetch(path: string, init?: RequestInit) {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(await adminRequestHeaders()),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  return response;
}

export async function fetchMyCoupons() {
  const json = await assertApiOk(await accountFetch("/api/account/coupons"), "쿠폰을 불러오지 못했어요.");
  return ((json as ApiList<UserCoupon>).items ?? []) as UserCoupon[];
}

export async function fetchMySellRequests() {
  const json = await assertApiOk(await accountFetch("/api/account/sell-requests"), "판매 내역을 불러오지 못했어요.");
  return ((json as ApiList<SellRequest>).items ?? []) as SellRequest[];
}

export async function createMySellRequest(input: {
  kind: SellKind;
  brand: string;
  itemName: string;
  condition: string;
  note?: string;
}) {
  await assertApiOk(
    await accountFetch("/api/account/sell-requests", {
      method: "POST",
      body: JSON.stringify(input),
    }),
    "판매 신청을 등록하지 못했어요."
  );
}

export async function fetchMyReturnRequests() {
  const json = await assertApiOk(await accountFetch("/api/account/returns"), "신청 내역을 불러오지 못했어요.");
  return ((json as ApiList<ReturnRequest>).items ?? []) as ReturnRequest[];
}

export async function createMyReturnRequest(input: {
  orderId: string;
  type: ReturnType;
  reason: string;
}) {
  await assertApiOk(
    await accountFetch("/api/account/returns", {
      method: "POST",
      body: JSON.stringify(input),
    }),
    "취소·교환·반품을 신청하지 못했어요."
  );
}

export async function fetchMyNotifications() {
  const json = await assertApiOk(await accountFetch("/api/account/notifications"), "알림을 불러오지 못했어요.");
  return ((json as ApiList<MemberNotification>).items ?? []) as MemberNotification[];
}

export async function markMyNotificationsRead(ids?: string[]) {
  await assertApiOk(
    await accountFetch("/api/account/notifications", {
      method: "PATCH",
      body: JSON.stringify({ ids }),
    }),
    "알림을 확인하지 못했어요."
  );
}

export async function saveMyProfile(input: {
  name?: string;
  phone?: string;
  addresses?: SavedAddress[];
  notificationSettings?: NotificationSettings;
  followedBrandIds?: string[];
}) {
  await assertApiOk(
    await accountFetch("/api/account/profile", {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
    "계정 정보를 저장하지 못했어요."
  );
}

export async function fetchMyProfile() {
  const json = await assertApiOk(await accountFetch("/api/account/profile"), "계정 정보를 불러오지 못했어요.");
  return json as {
    name?: string;
    grade?: MemberGrade;
    points?: number;
    phone?: string;
    addresses?: SavedAddress[];
    notificationSettings?: NotificationSettings;
    followedBrandIds?: string[];
  };
}

export async function fetchPublishedFaqs() {
  const response = await fetch("/api/faqs", { cache: "no-store" });
  const json = await assertApiOk(response, "FAQ를 불러오지 못했어요.");
  return ((json as ApiList<MemberFaq>).items ?? []) as MemberFaq[];
}

export async function fetchAdminCoupons() {
  const json = await assertApiOk(await adminFetch("/api/admin/member/coupons"), "쿠폰을 불러오지 못했어요.");
  return {
    templates: ((json as { templates?: CouponTemplate[] }).templates ?? []) as CouponTemplate[],
    issued: ((json as { issued?: UserCoupon[] }).issued ?? []) as UserCoupon[],
  };
}

export async function createAdminCoupon(input: Omit<CouponTemplate, "id" | "createdAt">) {
  await assertApiOk(
    await adminFetch("/api/admin/member/coupons", {
      method: "POST",
      body: JSON.stringify(input),
    }),
    "쿠폰을 만들지 못했어요."
  );
}

export async function issueAdminCoupon(couponId: string, userId: string) {
  await assertApiOk(
    await adminFetch("/api/admin/member/coupons", {
      method: "PATCH",
      body: JSON.stringify({ action: "issue", couponId, userId }),
    }),
    "쿠폰을 발급하지 못했어요."
  );
}

export async function adjustAdminPoints(input: { userId: string; amount: number; reason: string }) {
  await assertApiOk(
    await adminFetch("/api/admin/member/points", {
      method: "POST",
      body: JSON.stringify(input),
    }),
    "적립금을 조정하지 못했어요."
  );
}

export async function fetchAdminFaqs() {
  const json = await assertApiOk(await adminFetch("/api/admin/member/faqs"), "FAQ를 불러오지 못했어요.");
  return ((json as ApiList<MemberFaq>).items ?? []) as MemberFaq[];
}

export async function saveAdminFaq(input: Partial<MemberFaq> & { question: string; answer: string; category: string }) {
  await assertApiOk(
    await adminFetch("/api/admin/member/faqs", {
      method: "POST",
      body: JSON.stringify(input),
    }),
    "FAQ를 저장하지 못했어요."
  );
}

export async function deleteAdminFaq(id: string) {
  await assertApiOk(
    await adminFetch("/api/admin/member/faqs", {
      method: "PATCH",
      body: JSON.stringify({ id, action: "delete" }),
    }),
    "FAQ를 삭제하지 못했어요."
  );
}

export async function fetchAdminSellRequests() {
  const json = await assertApiOk(await adminFetch("/api/admin/member/sell-requests"), "판매 신청을 불러오지 못했어요.");
  return ((json as ApiList<SellRequest>).items ?? []) as SellRequest[];
}

export async function updateAdminSellRequest(
  id: string,
  input: {
    status?: SellStatus;
    estimatePrice?: number | null;
    settlementAmount?: number | null;
    adminNote?: string;
  }
) {
  await assertApiOk(
    await adminFetch("/api/admin/member/sell-requests", {
      method: "PATCH",
      body: JSON.stringify({ id, ...input }),
    }),
    "판매 상태를 변경하지 못했어요."
  );
}

export async function fetchAdminReturns() {
  const json = await assertApiOk(await adminFetch("/api/admin/member/returns"), "반품 신청을 불러오지 못했어요.");
  return ((json as ApiList<ReturnRequest>).items ?? []) as ReturnRequest[];
}

export async function updateAdminReturn(id: string, status: ReturnStatus, adminNote?: string) {
  await assertApiOk(
    await adminFetch("/api/admin/member/returns", {
      method: "PATCH",
      body: JSON.stringify({ id, status, adminNote }),
    }),
    "신청 상태를 변경하지 못했어요."
  );
}

export async function fetchAdminNotifications() {
  const json = await assertApiOk(await adminFetch("/api/admin/member/notifications"), "알림을 불러오지 못했어요.");
  return ((json as ApiList<MemberNotification>).items ?? []) as MemberNotification[];
}

export async function sendAdminNotification(input: {
  title: string;
  body: string;
  href?: string;
  kind?: MemberNotificationKind;
  userId?: string;
}) {
  await assertApiOk(
    await adminFetch("/api/admin/member/notifications", {
      method: "POST",
      body: JSON.stringify(input),
    }),
    "알림을 보내지 못했어요."
  );
}

export async function fetchAdminMemberSnapshot(userId: string) {
  const json = await assertApiOk(
    await adminFetch(`/api/admin/users/${userId}`),
    "회원 정보를 불러오지 못했어요."
  );
  return json;
}

export async function updateAdminMember(userId: string, input: { grade?: MemberGrade; phone?: string; name?: string }) {
  await assertApiOk(
    await adminFetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
    "회원 정보를 수정하지 못했어요."
  );
}

export async function updateAdminOrderDelivery(
  orderId: string,
  delivery: { courier?: string; invoiceNo?: string }
) {
  await assertApiOk(
    await adminFetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      body: JSON.stringify({ delivery }),
    }),
    "배송 정보를 저장하지 못했어요."
  );
}

export async function importAdminLogiiWorkbook(file: File) {
  const formData = new FormData();
  formData.set("file", file);
  const response = await fetch("/api/admin/orders/logii", {
    method: "POST",
    headers: await adminRequestHeaders(null),
    body: formData,
  });
  const json = await assertApiOk(
    response,
    "로지아이 배송 엑셀을 처리하지 못했어요."
  );
  return json as LogiiImportReport;
}

export async function fetchAdminLogiiShipments() {
  const json = await assertApiOk(
    await adminFetch("/api/admin/orders/logii"),
    "로지아이 배송 고객을 불러오지 못했어요."
  );
  return ((json as ApiList<LogiiShipmentRecord>).items ??
    []) as LogiiShipmentRecord[];
}

export async function fetchAdminMemberOverview() {
  const json = await assertApiOk(
    await adminFetch("/api/admin/member/overview"),
    "마이페이지 연동 현황을 불러오지 못했어요."
  );
  return json as {
    pendingSell: number;
    pendingReturns: number;
    unreadNotifications: number;
  };
}
