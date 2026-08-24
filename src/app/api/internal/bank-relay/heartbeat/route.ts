import { NextResponse } from "next/server";
import {
  RelayAuthenticationError,
  verifyRelayRequestSignature,
} from "@/lib/bank-relay/crypto";
import { processRelayHeartbeat } from "@/lib/bank-relay/process-heartbeat";
import { parseRelayHeartbeatPayload } from "@/lib/bank-relay/validation";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > 8 * 1024) {
      return NextResponse.json({ ok: false, message: "요청이 너무 큽니다." }, { status: 413 });
    }
    const headers = verifyRelayRequestSignature(request, rawBody);
    const payload = parseRelayHeartbeatPayload(rawBody);
    if (payload.deviceId !== headers.deviceId) {
      throw new RelayAuthenticationError();
    }
    await processRelayHeartbeat({ db: getAdminDb(), headers, payload });
    return NextResponse.json({ ok: true, serverTime: new Date().toISOString() });
  } catch (error) {
    if (error instanceof RelayAuthenticationError) {
      return NextResponse.json({ ok: false, message: "인증에 실패했습니다." }, { status: 401 });
    }
    const code = error instanceof Error ? error.message : "RELAY_HEARTBEAT_FAILED";
    if (code === "INVALID_RELAY_PAYLOAD" || error instanceof SyntaxError) {
      return NextResponse.json(
        { ok: false, message: "Heartbeat 형식이 올바르지 않습니다." },
        { status: 400 }
      );
    }
    if (code === "KB_RELAY_DEVICE_SECRET_NOT_CONFIGURED") {
      return NextResponse.json(
        { ok: false, message: "릴레이 서버가 아직 설정되지 않았습니다." },
        { status: 503 }
      );
    }
    console.error("[bank-relay] heartbeat failed", code);
    return NextResponse.json(
      { ok: false, message: "Heartbeat를 처리하지 못했습니다." },
      { status: 500 }
    );
  }
}
