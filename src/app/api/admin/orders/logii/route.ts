import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin-auth";
import {
  importLogiiWorkbook,
  listLogiiShipments,
} from "@/lib/logii-delivery-server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json(
      { ok: false, message: "관리자 권한이 필요합니다." },
      { status: 403 }
    );
  }

  try {
    return NextResponse.json({ ok: true, items: await listLogiiShipments() });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "로지아이 배송 고객을 불러오지 못했습니다.",
      },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json(
      { ok: false, message: "관리자 권한이 필요합니다." },
      { status: 403 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, message: "업로드할 로지아이 엑셀 파일을 선택해주세요." },
        { status: 400 }
      );
    }

    return NextResponse.json(await importLogiiWorkbook(file));
  } catch (error) {
    console.error("[admin-orders] Logii workbook import failed", error);
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "로지아이 배송 엑셀을 처리하지 못했습니다.",
      },
      { status: 400 }
    );
  }
}
