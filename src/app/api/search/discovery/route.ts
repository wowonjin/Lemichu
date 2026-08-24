import { NextResponse } from "next/server";
import { getSearchDiscovery } from "@/lib/search/discovery";

export const runtime = "nodejs";

export async function GET() {
  try {
    const discovery = await getSearchDiscovery();
    return NextResponse.json(discovery);
  } catch (error) {
    console.error("[search] discovery failed", error);
    return NextResponse.json({ message: "검색 추천 정보를 불러오지 못했어요." }, { status: 500 });
  }
}
