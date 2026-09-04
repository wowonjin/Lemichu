import "server-only";

import { FieldValue, type DocumentData, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import { faqGroups } from "@/data/faq";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  type NotificationSettings,
  type SavedAddress,
} from "@/lib/accountStorage";
import { getAdminDb } from "@/lib/firebase-admin";
import {
  FAQ_CATEGORIES,
  NOTIFICATION_KINDS,
  RETURN_STATUSES,
  RETURN_TYPES,
  SELL_KINDS,
  SELL_STATUSES,
  formatCouponValue,
  isMemberGrade,
  resolveMemberGrade,
  toIsoDate,
  type CouponDiscountType,
  type CouponTemplate,
  type MemberFaq,
  type MemberGrade,
  type MemberNotification,
  type MemberNotificationKind,
  type ReturnRequest,
  type ReturnStatus,
  type ReturnType,
  type SellKind,
  type SellRequest,
  type SellStatus,
  type UserCoupon,
  type UserCouponStatus,
} from "@/lib/member-account";
import { toSafePoints } from "@/lib/points";
import { restoreOrderInventory } from "@/lib/payment-completion";
import { restoreOrderPoints } from "@/lib/points-admin";

const COUPONS = "coupons";
const USER_COUPONS = "userCoupons";
const FAQS = "faqs";
const SELL_REQUESTS = "sellRequests";
const RETURN_REQUESTS = "returnRequests";
const NOTIFICATIONS = "memberNotifications";

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function sortByCreatedDesc<T extends { createdAt?: string | null }>(items: T[]) {
  return [...items].sort((a, b) => {
    const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
    const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
    return bTime - aTime;
  });
}

function mapCoupon(doc: QueryDocumentSnapshot<DocumentData>): CouponTemplate {
  const data = doc.data();
  return {
    id: doc.id,
    name: asString(data.name),
    code: asString(data.code).toUpperCase(),
    discountType: data.discountType === "percent" ? "percent" : "amount",
    discountValue: Math.max(0, asNumber(data.discountValue)),
    minOrder: Math.max(0, asNumber(data.minOrder)),
    expiresAt: toIsoDate(data.expiresAt),
    active: data.active !== false,
    createdAt: toIsoDate(data.createdAt),
  };
}

function mapUserCoupon(doc: QueryDocumentSnapshot<DocumentData>): UserCoupon {
  const data = doc.data();
  const expiresAt = toIsoDate(data.expiresAt);
  const expired = Boolean(expiresAt && Date.parse(expiresAt) < Date.now());
  const status = (asString(data.status, "available") || "available") as UserCouponStatus;
  return {
    id: doc.id,
    userId: asString(data.userId),
    couponId: asString(data.couponId),
    name: asString(data.name),
    code: asString(data.code).toUpperCase(),
    discountType: data.discountType === "percent" ? "percent" : "amount",
    discountValue: Math.max(0, asNumber(data.discountValue)),
    minOrder: Math.max(0, asNumber(data.minOrder)),
    expiresAt,
    status: expired && status === "available" ? "expired" : status,
    usedOrderId: asString(data.usedOrderId) || undefined,
    issuedAt: toIsoDate(data.issuedAt ?? data.createdAt),
  };
}

function mapFaq(doc: QueryDocumentSnapshot<DocumentData>): MemberFaq {
  const data = doc.data();
  return {
    id: doc.id,
    category: asString(data.category, FAQ_CATEGORIES[0]),
    question: asString(data.question),
    answer: asString(data.answer),
    order: asNumber(data.order),
    published: data.published !== false,
  };
}

function mapSellRequest(doc: QueryDocumentSnapshot<DocumentData>): SellRequest {
  const data = doc.data();
  const kind = SELL_KINDS.includes(data.kind) ? data.kind : "sell";
  const status = SELL_STATUSES.includes(data.status) ? data.status : "received";
  return {
    id: doc.id,
    userId: asString(data.userId),
    userEmail: asString(data.userEmail),
    userName: asString(data.userName),
    kind: kind as SellKind,
    brand: asString(data.brand),
    itemName: asString(data.itemName),
    condition: asString(data.condition),
    note: asString(data.note),
    status: status as SellStatus,
    estimatePrice: data.estimatePrice == null ? undefined : asNumber(data.estimatePrice),
    settlementAmount: data.settlementAmount == null ? undefined : asNumber(data.settlementAmount),
    adminNote: asString(data.adminNote) || undefined,
    createdAt: toIsoDate(data.createdAt),
    updatedAt: toIsoDate(data.updatedAt),
  };
}

function mapReturnRequest(doc: QueryDocumentSnapshot<DocumentData>): ReturnRequest {
  const data = doc.data();
  const type = RETURN_TYPES.includes(data.type) ? data.type : "return";
  const status = RETURN_STATUSES.includes(data.status) ? data.status : "requested";
  return {
    id: doc.id,
    userId: asString(data.userId),
    userEmail: asString(data.userEmail),
    userName: asString(data.userName),
    orderId: asString(data.orderId),
    type: type as ReturnType,
    reason: asString(data.reason),
    status: status as ReturnStatus,
    adminNote: asString(data.adminNote) || undefined,
    createdAt: toIsoDate(data.createdAt),
    updatedAt: toIsoDate(data.updatedAt),
  };
}

function mapNotification(doc: QueryDocumentSnapshot<DocumentData>): MemberNotification {
  const data = doc.data();
  const kind = NOTIFICATION_KINDS.includes(data.kind) ? data.kind : "admin";
  return {
    id: doc.id,
    userId: asString(data.userId),
    title: asString(data.title),
    body: asString(data.body),
    href: asString(data.href) || undefined,
    kind: kind as MemberNotificationKind,
    read: Boolean(data.read),
    createdAt: toIsoDate(data.createdAt),
  };
}

async function queryByUser<T>(
  collectionName: string,
  userId: string,
  map: (doc: QueryDocumentSnapshot<DocumentData>) => T
) {
  const snapshot = await getAdminDb().collection(collectionName).where("userId", "==", userId).get();
  return snapshot.docs.map(map);
}

export async function listCouponTemplates() {
  const snapshot = await getAdminDb().collection(COUPONS).get();
  return sortByCreatedDesc(snapshot.docs.map(mapCoupon));
}

export async function createCouponTemplate(input: {
  name: string;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minOrder?: number;
  expiresAt?: string | null;
  active?: boolean;
}) {
  const name = asString(input.name);
  const code = asString(input.code).toUpperCase();
  if (!name || !code) throw new Error("쿠폰 이름과 코드를 입력해주세요.");
  if (input.discountValue <= 0) throw new Error("할인 금액을 확인해주세요.");

  const ref = await getAdminDb().collection(COUPONS).add({
    name,
    code,
    discountType: input.discountType,
    discountValue: Math.floor(input.discountValue),
    minOrder: Math.max(0, Math.floor(input.minOrder ?? 0)),
    expiresAt: input.expiresAt || null,
    active: input.active !== false,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function updateCouponTemplate(
  id: string,
  input: Partial<Pick<CouponTemplate, "name" | "active" | "expiresAt" | "minOrder">>
) {
  await getAdminDb().collection(COUPONS).doc(id).update({
    ...(input.name != null ? { name: asString(input.name) } : {}),
    ...(input.active != null ? { active: Boolean(input.active) } : {}),
    ...(input.expiresAt !== undefined ? { expiresAt: input.expiresAt || null } : {}),
    ...(input.minOrder != null ? { minOrder: Math.max(0, Math.floor(input.minOrder)) } : {}),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function listUserCoupons(userId?: string) {
  const db = getAdminDb();
  const snapshot = userId
    ? await db.collection(USER_COUPONS).where("userId", "==", userId).get()
    : await db.collection(USER_COUPONS).get();
  return snapshot.docs
    .map(mapUserCoupon)
    .sort((a, b) => Date.parse(a.issuedAt ?? "") - Date.parse(b.issuedAt ?? "") || 0)
    .reverse();
}

export async function issueCouponToUser({
  couponId,
  userId,
}: {
  couponId: string;
  userId: string;
}) {
  const db = getAdminDb();
  const [couponSnap, userSnap] = await Promise.all([
    db.collection(COUPONS).doc(couponId).get(),
    db.collection("users").doc(userId).get(),
  ]);
  if (!couponSnap.exists) throw new Error("쿠폰을 찾을 수 없어요.");
  if (!userSnap.exists) throw new Error("회원을 찾을 수 없어요.");
  const coupon = mapCoupon(couponSnap as QueryDocumentSnapshot<DocumentData>);
  if (!coupon.active) throw new Error("비활성 쿠폰은 발급할 수 없어요.");

  const issued = await db.collection(USER_COUPONS).add({
    userId,
    couponId: coupon.id,
    name: coupon.name,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    minOrder: coupon.minOrder,
    expiresAt: coupon.expiresAt,
    status: "available",
    issuedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
  });

  await createMemberNotification({
    userId,
    title: "쿠폰이 발급되었습니다",
    body: `${coupon.name} · ${formatCouponValue(coupon)}`,
    href: "/my/coupons",
    kind: "event",
  });

  return issued.id;
}

export async function adjustMemberPoints({
  userId,
  amount,
  reason,
}: {
  userId: string;
  amount: number;
  reason: string;
}) {
  const points = Math.floor(amount);
  if (!points) throw new Error("적립금 수량을 입력해주세요.");
  const note = asString(reason) || (points > 0 ? "관리자 지급" : "관리자 차감");
  const db = getAdminDb();
  const userRef = db.collection("users").doc(userId);
  const ledgerRef = userRef.collection("pointLedger").doc();

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists) throw new Error("회원을 찾을 수 없어요.");
    const current = toSafePoints(snap.data()?.points);
    if (points < 0 && current + points < 0) {
      throw new Error("보유 적립금보다 많이 차감할 수 없어요.");
    }
    tx.set(
      userRef,
      {
        points: FieldValue.increment(points),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    tx.set(ledgerRef, {
      type: points > 0 ? "earn" : "spend",
      amount: Math.abs(points),
      reason: note,
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  await createMemberNotification({
    userId,
    title: points > 0 ? "적립금이 지급되었습니다" : "적립금이 조정되었습니다",
    body: `${note} · ${Math.abs(points).toLocaleString("ko-KR")}원`,
    href: "/my/points",
    kind: "admin",
  });
}

export async function listFaqs(publishedOnly = false) {
  const snapshot = await getAdminDb().collection(FAQS).get();
  let items = snapshot.docs.map(mapFaq);
  if (items.length === 0) {
    items = await seedDefaultFaqs();
  }
  if (publishedOnly) items = items.filter((item) => item.published);
  return items.sort((a, b) => a.order - b.order || a.question.localeCompare(b.question, "ko"));
}

export async function seedDefaultFaqs() {
  const db = getAdminDb();
  const existing = await db.collection(FAQS).limit(1).get();
  if (!existing.empty) {
    return (await db.collection(FAQS).get()).docs.map(mapFaq);
  }

  const batch = db.batch();
  faqGroups.forEach((group, groupIndex) => {
    group.items.forEach((item, itemIndex) => {
      const ref = db.collection(FAQS).doc();
      batch.set(ref, {
        category: group.category,
        question: item.q,
        answer: item.a,
        order: groupIndex * 10 + itemIndex,
        published: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
  });
  await batch.commit();
  return (await db.collection(FAQS).get()).docs.map(mapFaq);
}

export async function upsertFaq(input: {
  id?: string;
  category: string;
  question: string;
  answer: string;
  order?: number;
  published?: boolean;
}) {
  const question = asString(input.question);
  const answer = asString(input.answer);
  if (!question || !answer) throw new Error("질문과 답변을 입력해주세요.");
  const db = getAdminDb();
  const payload = {
    category: asString(input.category, FAQ_CATEGORIES[0]),
    question,
    answer,
    order: Math.max(0, Math.floor(input.order ?? 0)),
    published: input.published !== false,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (input.id) {
    await db.collection(FAQS).doc(input.id).set(payload, { merge: true });
    return input.id;
  }
  const ref = await db.collection(FAQS).add({
    ...payload,
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function deleteFaq(id: string) {
  await getAdminDb().collection(FAQS).doc(id).delete();
}

export async function listSellRequests(userId?: string) {
  const items = userId
    ? await queryByUser(SELL_REQUESTS, userId, mapSellRequest)
    : (await getAdminDb().collection(SELL_REQUESTS).get()).docs.map(mapSellRequest);
  return sortByCreatedDesc(items);
}

export async function createSellRequest(input: {
  userId: string;
  userEmail: string;
  userName: string;
  kind: SellKind;
  brand: string;
  itemName: string;
  condition: string;
  note?: string;
}) {
  const brand = asString(input.brand);
  const itemName = asString(input.itemName);
  if (!brand || !itemName) throw new Error("브랜드와 상품명을 입력해주세요.");

  const ref = await getAdminDb().collection(SELL_REQUESTS).add({
    userId: input.userId,
    userEmail: asString(input.userEmail),
    userName: asString(input.userName),
    kind: SELL_KINDS.includes(input.kind) ? input.kind : "sell",
    brand,
    itemName,
    condition: asString(input.condition, "상태 미입력"),
    note: asString(input.note),
    status: "received",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function updateSellRequest(
  id: string,
  input: {
    status?: SellStatus;
    estimatePrice?: number | null;
    settlementAmount?: number | null;
    adminNote?: string;
  }
) {
  const db = getAdminDb();
  const snap = await db.collection(SELL_REQUESTS).doc(id).get();
  if (!snap.exists) throw new Error("판매 신청을 찾을 수 없어요.");
  const current = mapSellRequest(snap as QueryDocumentSnapshot<DocumentData>);

  await snap.ref.update({
    ...(input.status && SELL_STATUSES.includes(input.status) ? { status: input.status } : {}),
    ...(input.estimatePrice !== undefined
      ? { estimatePrice: input.estimatePrice == null ? null : Math.max(0, Math.floor(input.estimatePrice)) }
      : {}),
    ...(input.settlementAmount !== undefined
      ? {
          settlementAmount:
            input.settlementAmount == null ? null : Math.max(0, Math.floor(input.settlementAmount)),
        }
      : {}),
    ...(input.adminNote !== undefined ? { adminNote: asString(input.adminNote) } : {}),
    updatedAt: FieldValue.serverTimestamp(),
  });

  if (input.status && input.status !== current.status) {
    await createMemberNotification({
      userId: current.userId,
      title: "판매 진행 상태가 변경되었습니다",
      body: `${current.brand} ${current.itemName}`,
      href: current.kind === "estimate" ? "/my/estimate" : "/my/sell",
      kind: "admin",
    });
  }
}

export async function listReturnRequests(userId?: string) {
  const items = userId
    ? await queryByUser(RETURN_REQUESTS, userId, mapReturnRequest)
    : (await getAdminDb().collection(RETURN_REQUESTS).get()).docs.map(mapReturnRequest);
  return sortByCreatedDesc(items);
}

export async function createReturnRequest(input: {
  userId: string;
  userEmail: string;
  userName: string;
  orderId: string;
  type: ReturnType;
  reason: string;
}) {
  const reason = asString(input.reason);
  const orderId = asString(input.orderId);
  if (!orderId || !reason) throw new Error("주문과 신청 사유를 입력해주세요.");

  const db = getAdminDb();
  const orderSnap = await db.collection("orders").doc(orderId).get();
  if (!orderSnap.exists) throw new Error("주문 정보를 찾을 수 없어요.");
  if (asString(orderSnap.data()?.userId) !== input.userId) {
    throw new Error("본인 주문만 신청할 수 있어요.");
  }

  const existing = await db.collection(RETURN_REQUESTS).where("userId", "==", input.userId).get();
  if (
    existing.docs.some(
      (doc) =>
        asString(doc.data().orderId) === orderId &&
        ["requested", "approved"].includes(asString(doc.data().status))
    )
  ) {
    throw new Error("이미 처리 중인 취소·교환·반품 신청이 있어요.");
  }

  const ref = await db.collection(RETURN_REQUESTS).add({
    userId: input.userId,
    userEmail: asString(input.userEmail),
    userName: asString(input.userName),
    orderId,
    type: RETURN_TYPES.includes(input.type) ? input.type : "return",
    reason,
    status: "requested",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function updateReturnRequest(
  id: string,
  input: { status: ReturnStatus; adminNote?: string }
) {
  if (!RETURN_STATUSES.includes(input.status)) throw new Error("처리 상태가 올바르지 않아요.");
  const db = getAdminDb();
  const snap = await db.collection(RETURN_REQUESTS).doc(id).get();
  if (!snap.exists) throw new Error("신청 내역을 찾을 수 없어요.");
  const request = mapReturnRequest(snap as QueryDocumentSnapshot<DocumentData>);

  await snap.ref.update({
    status: input.status,
    adminNote: asString(input.adminNote),
    updatedAt: FieldValue.serverTimestamp(),
  });

  if ((input.status === "approved" || input.status === "completed") && request.type === "cancel") {
    const orderRef = db.collection("orders").doc(request.orderId);
    const orderSnap = await orderRef.get();
    const previousStatus = asString(orderSnap.data()?.status);
    if (orderSnap.exists && previousStatus && previousStatus !== "cancelled" && previousStatus !== "failed") {
      await orderRef.update({
        status: "cancelled",
        updatedAt: FieldValue.serverTimestamp(),
      });
      await restoreOrderPoints(request.orderId).catch(() => undefined);
      await restoreOrderInventory(request.orderId).catch(() => undefined);
    }
  }

  await createMemberNotification({
    userId: request.userId,
    title: "취소·교환·반품 상태가 변경되었습니다",
    body: request.reason,
    href: "/my/returns",
    kind: "order",
  });
}

export async function listNotifications(userId?: string) {
  const items = userId
    ? await queryByUser(NOTIFICATIONS, userId, mapNotification)
    : (await getAdminDb().collection(NOTIFICATIONS).get()).docs.map(mapNotification);
  return sortByCreatedDesc(items);
}

export async function createMemberNotification(input: {
  userId: string;
  title: string;
  body: string;
  href?: string;
  kind?: MemberNotificationKind;
}) {
  const title = asString(input.title);
  const body = asString(input.body);
  if (!input.userId || !title || !body) return "";

  const ref = await getAdminDb().collection(NOTIFICATIONS).add({
    userId: input.userId,
    title,
    body,
    href: asString(input.href) || "/my",
    kind: input.kind && NOTIFICATION_KINDS.includes(input.kind) ? input.kind : "admin",
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function broadcastNotification(input: {
  title: string;
  body: string;
  href?: string;
  kind?: MemberNotificationKind;
  userId?: string;
}) {
  const title = asString(input.title);
  const body = asString(input.body);
  if (!title || !body) throw new Error("알림 제목과 내용을 입력해주세요.");

  if (input.userId) {
    await createMemberNotification({
      userId: input.userId,
      title,
      body,
      href: input.href,
      kind: input.kind,
    });
    return 1;
  }

  const users = await getAdminDb().collection("users").get();
  const batchSize = 400;
  const docs = users.docs;
  for (let index = 0; index < docs.length; index += batchSize) {
    const batch = getAdminDb().batch();
    docs.slice(index, index + batchSize).forEach((userDoc) => {
      const ref = getAdminDb().collection(NOTIFICATIONS).doc();
      batch.set(ref, {
        userId: userDoc.id,
        title,
        body,
        href: asString(input.href) || "/my/notifications",
        kind: input.kind && NOTIFICATION_KINDS.includes(input.kind) ? input.kind : "event",
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();
  }
  return docs.length;
}

export async function markNotificationsRead(userId: string, ids?: string[]) {
  const items = await listNotifications(userId);
  const targets = ids?.length ? items.filter((item) => ids.includes(item.id)) : items.filter((item) => !item.read);
  const db = getAdminDb();
  const batch = db.batch();
  targets.forEach((item) => {
    batch.update(db.collection(NOTIFICATIONS).doc(item.id), {
      read: true,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  if (targets.length) await batch.commit();
  return targets.length;
}

export async function updateMemberProfile(
  userId: string,
  input: {
    grade?: MemberGrade;
    phone?: string;
    addresses?: SavedAddress[];
    notificationSettings?: NotificationSettings;
    followedBrandIds?: string[];
    name?: string;
  },
  options?: { allowGrade?: boolean }
) {
  const payload: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (options?.allowGrade && input.grade && isMemberGrade(input.grade)) {
    payload.grade = input.grade;
  }
  if (input.phone !== undefined) payload.phone = asString(input.phone);
  if (input.name !== undefined) payload.name = asString(input.name);
  if (input.addresses) payload.addresses = input.addresses;
  if (input.notificationSettings) {
    payload.notificationSettings = {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      ...input.notificationSettings,
    };
  }
  if (input.followedBrandIds) payload.followedBrandIds = input.followedBrandIds;

  await getAdminDb().collection("users").doc(userId).set(payload, { merge: true });
}

export async function getMemberSnapshot(userId: string) {
  const db = getAdminDb();
  const userSnap = await db.collection("users").doc(userId).get();
  if (!userSnap.exists) throw new Error("회원을 찾을 수 없어요.");
  const data = userSnap.data() ?? {};

  const [ordersSnap, wishlistSnap, ledgerSnap, coupons, sellRequests, returns, notifications] =
    await Promise.all([
      db.collection("orders").where("userId", "==", userId).get(),
      db.collection("users").doc(userId).collection("wishlist").get(),
      db.collection("users").doc(userId).collection("pointLedger").get(),
      listUserCoupons(userId),
      listSellRequests(userId),
      listReturnRequests(userId),
      listNotifications(userId),
    ]);

  return {
    user: {
      uid: userId,
      name: asString(data.name),
      email: asString(data.email),
      phone: asString(data.phone) || undefined,
      provider: asString(data.provider, "email"),
      role: data.role === "admin" ? "admin" : "member",
      grade: resolveMemberGrade(data.grade),
      points: toSafePoints(data.points),
      addresses: Array.isArray(data.addresses) ? (data.addresses as SavedAddress[]) : [],
      notificationSettings: {
        ...DEFAULT_NOTIFICATION_SETTINGS,
        ...(data.notificationSettings ?? {}),
      },
      followedBrandIds: Array.isArray(data.followedBrandIds)
        ? data.followedBrandIds.filter((item: unknown) => typeof item === "string")
        : [],
      lastLoginAt: toIsoDate(data.lastLoginAt),
      createdAt: toIsoDate(data.createdAt),
    },
    orders: ordersSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: toIsoDate(doc.data().createdAt),
    })),
    wishlistIds: wishlistSnap.docs.map((doc) => asString(doc.data().productId, doc.id)),
    ledger: ledgerSnap.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: toIsoDate(doc.data().createdAt),
      }))
      .sort((a, b) => Date.parse(String(b.createdAt ?? 0)) - Date.parse(String(a.createdAt ?? 0))),
    coupons,
    sellRequests,
    returns,
    notifications,
  };
}

export async function updateOrderDelivery(
  orderId: string,
  delivery: { courier?: string; invoiceNo?: string }
) {
  const db = getAdminDb();
  const ref = db.collection("orders").doc(orderId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("주문 정보를 찾을 수 없어요.");
  const current = (snap.data()?.delivery ?? {}) as Record<string, unknown>;
  await ref.update({
    delivery: {
      ...current,
      ...(delivery.courier !== undefined ? { courier: asString(delivery.courier) } : {}),
      ...(delivery.invoiceNo !== undefined ? { invoiceNo: asString(delivery.invoiceNo) } : {}),
    },
    updatedAt: FieldValue.serverTimestamp(),
  });

  const userId = asString(snap.data()?.userId);
  if (userId && (delivery.courier || delivery.invoiceNo)) {
    await createMemberNotification({
      userId,
      title: "배송 정보가 등록되었습니다",
      body: [delivery.courier, delivery.invoiceNo].filter(Boolean).join(" · "),
      href: `/my/delivery?order=${orderId}`,
      kind: "order",
    });
  }
}

export async function getMemberAdminOverview() {
  const [sellRequests, returns, notifications] = await Promise.all([
    listSellRequests(),
    listReturnRequests(),
    listNotifications(),
  ]);
  return {
    pendingSell: sellRequests.filter((item) => item.status !== "settled" && item.status !== "rejected").length,
    pendingReturns: returns.filter((item) => item.status === "requested").length,
    unreadNotifications: notifications.filter((item) => !item.read).length,
    sellRequests: sellRequests.slice(0, 5),
    returns: returns.slice(0, 5),
  };
}
