import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { adminForbidden } from "@/lib/account-request";
import {
  adjustMemberPoints,
  broadcastNotification,
  createCouponTemplate,
  deleteFaq,
  getMemberAdminOverview,
  issueCouponToUser,
  listCouponTemplates,
  listFaqs,
  listNotifications,
  listReturnRequests,
  listSellRequests,
  listUserCoupons,
  seedDefaultFaqs,
  updateCouponTemplate,
  updateReturnRequest,
  updateSellRequest,
  upsertFaq,
} from "@/lib/member-account-admin";
import {
  RETURN_STATUSES,
  SELL_STATUSES,
  type ReturnStatus,
  type SellStatus,
} from "@/lib/member-account";

export const runtime = "nodejs";

type Params = Promise<{ resource: string }>;

export async function GET(request: Request, { params }: { params: Params }) {
  if (!(await verifyAdminRequest(request))) return adminForbidden();

  const { resource } = await params;

  try {
    if (resource === "overview") {
      return NextResponse.json({ ok: true, ...(await getMemberAdminOverview()) });
    }
    if (resource === "coupons") {
      const [templates, issued] = await Promise.all([listCouponTemplates(), listUserCoupons()]);
      return NextResponse.json({ ok: true, templates, issued });
    }
    if (resource === "faqs") {
      return NextResponse.json({ ok: true, items: await listFaqs(false) });
    }
    if (resource === "sell-requests") {
      return NextResponse.json({ ok: true, items: await listSellRequests() });
    }
    if (resource === "returns") {
      return NextResponse.json({ ok: true, items: await listReturnRequests() });
    }
    if (resource === "notifications") {
      return NextResponse.json({ ok: true, items: await listNotifications() });
    }
    return NextResponse.json({ ok: false, message: "지원하지 않는 관리 항목이에요." }, { status: 404 });
  } catch (error) {
    console.error(`[admin-member] GET ${resource} failed`, error);
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "불러오지 못했어요." },
      { status: 400 }
    );
  }
}

export async function POST(request: Request, { params }: { params: Params }) {
  if (!(await verifyAdminRequest(request))) return adminForbidden();
  const { resource } = await params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  try {
    if (resource === "coupons") {
      const id = await createCouponTemplate({
        name: String(body?.name ?? ""),
        code: String(body?.code ?? ""),
        discountType: body?.discountType === "percent" ? "percent" : "amount",
        discountValue: Number(body?.discountValue ?? 0),
        minOrder: Number(body?.minOrder ?? 0),
        expiresAt: body?.expiresAt ? String(body.expiresAt) : null,
        active: body?.active !== false,
      });
      return NextResponse.json({ ok: true, id });
    }
    if (resource === "points") {
      await adjustMemberPoints({
        userId: String(body?.userId ?? ""),
        amount: Number(body?.amount ?? 0),
        reason: String(body?.reason ?? ""),
      });
      return NextResponse.json({ ok: true });
    }
    if (resource === "faqs") {
      const id = await upsertFaq({
        id: body?.id ? String(body.id) : undefined,
        category: String(body?.category ?? ""),
        question: String(body?.question ?? ""),
        answer: String(body?.answer ?? ""),
        order: Number(body?.order ?? 0),
        published: body?.published !== false,
      });
      return NextResponse.json({ ok: true, id });
    }
    if (resource === "notifications") {
      const count = await broadcastNotification({
        title: String(body?.title ?? ""),
        body: String(body?.body ?? ""),
        href: body?.href ? String(body.href) : undefined,
        kind: body?.kind as never,
        userId: body?.userId ? String(body.userId) : undefined,
      });
      return NextResponse.json({ ok: true, count });
    }
    return NextResponse.json({ ok: false, message: "지원하지 않는 관리 항목이에요." }, { status: 404 });
  } catch (error) {
    console.error(`[admin-member] POST ${resource} failed`, error);
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "저장하지 못했어요." },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request, { params }: { params: Params }) {
  if (!(await verifyAdminRequest(request))) return adminForbidden();
  const { resource } = await params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  try {
    if (resource === "coupons") {
      if (body?.action === "issue") {
        const id = await issueCouponToUser({
          couponId: String(body.couponId ?? ""),
          userId: String(body.userId ?? ""),
        });
        return NextResponse.json({ ok: true, id });
      }
      await updateCouponTemplate(String(body?.id ?? ""), {
        name: body?.name ? String(body.name) : undefined,
        active: typeof body?.active === "boolean" ? body.active : undefined,
        expiresAt: body?.expiresAt !== undefined ? String(body.expiresAt || "") || null : undefined,
        minOrder: body?.minOrder != null ? Number(body.minOrder) : undefined,
      });
      return NextResponse.json({ ok: true });
    }
    if (resource === "faqs") {
      if (body?.action === "delete") {
        await deleteFaq(String(body.id ?? ""));
        return NextResponse.json({ ok: true });
      }
      if (body?.action === "seed") {
        await seedDefaultFaqs();
        return NextResponse.json({ ok: true });
      }
      return NextResponse.json({ ok: false, message: "FAQ 요청이 올바르지 않아요." }, { status: 400 });
    }
    if (resource === "sell-requests") {
      await updateSellRequest(String(body?.id ?? ""), {
        status: SELL_STATUSES.includes(body?.status as SellStatus)
          ? (body?.status as SellStatus)
          : undefined,
        estimatePrice: body?.estimatePrice === null ? null : body?.estimatePrice != null ? Number(body.estimatePrice) : undefined,
        settlementAmount:
          body?.settlementAmount === null
            ? null
            : body?.settlementAmount != null
              ? Number(body.settlementAmount)
              : undefined,
        adminNote: body?.adminNote != null ? String(body.adminNote) : undefined,
      });
      return NextResponse.json({ ok: true });
    }
    if (resource === "returns") {
      await updateReturnRequest(String(body?.id ?? ""), {
        status: RETURN_STATUSES.includes(body?.status as ReturnStatus)
          ? (body?.status as ReturnStatus)
          : "requested",
        adminNote: body?.adminNote != null ? String(body.adminNote) : undefined,
      });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ ok: false, message: "지원하지 않는 관리 항목이에요." }, { status: 404 });
  } catch (error) {
    console.error(`[admin-member] PATCH ${resource} failed`, error);
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "변경하지 못했어요." },
      { status: 400 }
    );
  }
}
