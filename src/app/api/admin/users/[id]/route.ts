import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { adminForbidden } from "@/lib/account-request";
import { getMemberSnapshot, updateMemberProfile } from "@/lib/member-account-admin";
import { isMemberGrade } from "@/lib/member-account";

export const runtime = "nodejs";

type Params = Promise<{ id: string }>;

export async function GET(request: Request, { params }: { params: Params }) {
  if (!(await verifyAdminRequest(request))) return adminForbidden();

  try {
    const { id } = await params;
    const snapshot = await getMemberSnapshot(id);
    return NextResponse.json({ ok: true, ...snapshot });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "회원 정보를 불러오지 못했어요." },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request, { params }: { params: Params }) {
  if (!(await verifyAdminRequest(request))) return adminForbidden();

  try {
    const { id } = await params;
    const body = (await request.json().catch(() => null)) as {
      grade?: string;
      phone?: string;
      name?: string;
    } | null;

    await updateMemberProfile(
      id,
      {
        grade: isMemberGrade(body?.grade) ? body.grade : undefined,
        phone: body?.phone,
        name: body?.name,
      },
      { allowGrade: true }
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "회원 정보를 수정하지 못했어요." },
      { status: 400 }
    );
  }
}
