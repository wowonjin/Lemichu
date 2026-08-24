import { NextResponse } from "next/server";
import { getSearchSuggestions } from "@/lib/search/discovery";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") ?? "";
    const usedOnly = searchParams.get("used") === "1";
    const suggestions = await getSearchSuggestions(query, usedOnly);
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("[search] suggest failed", error);
    return NextResponse.json({ suggestions: [] });
  }
}
