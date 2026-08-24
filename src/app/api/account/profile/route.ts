import { NextResponse } from "next/server";
import { accountErrorResponse, requireAccountActor } from "@/lib/account-request";
import { getMemberSnapshot, updateMemberProfile } from "@/lib/member-account-admin";
import type { NotificationSettings, SavedAddress } from "@/lib/accountStorage";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await requireAccountActor(request);
    const snapshot = await getMemberSnapshot(user.uid);
    return NextResponse.json({ ok: true, ...snapshot.user });
  } catch (error) {
    return accountErrorResponse(error, "계정 정보를 불러오지 못했어요.");
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireAccountActor(request);
    const body = (await request.json().catch(() => null)) as {
      name?: string;
      phone?: string;
      addresses?: SavedAddress[];
      notificationSettings?: NotificationSettings;
      followedBrandIds?: string[];
    } | null;

    await updateMemberProfile(user.uid, {
      name: body?.name,
      phone: body?.phone,
      addresses: body?.addresses,
      notificationSettings: body?.notificationSettings,
      followedBrandIds: body?.followedBrandIds,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return accountErrorResponse(error, "계정 정보를 저장하지 못했어요.");
  }
}
