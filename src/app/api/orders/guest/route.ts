import { createHash, randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import {
  isValidDepositorName,
  normalizeDepositorName,
} from "@/lib/bank-relay/normalize";
import { BANK_TRANSFER_ACCOUNT } from "@/lib/bank-transfer";
import {
  checkoutOrderErrorMessage,
  checkoutOrderErrorStatus,
  generateBankTransferOrderId,
  getDepositDueAt,
  parseCheckoutDelivery,
  parseCheckoutItems,
  readOrderString,
} from "@/lib/bank-transfer-order-server";
import { getRegisteredProducts } from "@/lib/catalog";
import {
  calculateCheckoutAmounts,
  resolveCheckoutItems,
  toOrderItemSnapshot,
} from "@/lib/checkout";
import { revalidateProductCatalog } from "@/lib/catalog-revalidate";
import { getAdminDb } from "@/lib/firebase-admin";
import {
  computeInventoryUpdates,
  writeInventoryUpdates,
} from "@/lib/payment-completion/inventory-tx";

export const runtime = "nodejs";

const scryptAsync = promisify(scrypt);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidGuestPassword(value: string) {
  if (value.length < 10 || value.length > 16 || /\s/.test(value)) return false;
  let kinds = 0;
  if (/[a-z]/.test(value)) kinds += 1;
  if (/[A-Z]/.test(value)) kinds += 1;
  if (/[0-9]/.test(value)) kinds += 1;
  if (/[^A-Za-z0-9]/.test(value)) kinds += 1;
  return kinds >= 2;
}

async function hashGuestPassword(password: string) {
  const salt = randomBytes(16);
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return {
    algorithm: "scrypt-v1",
    salt: salt.toString("base64"),
    hash: derivedKey.toString("base64"),
  };
}

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 32_768) {
      return NextResponse.json(
        { ok: false, message: "주문 요청 데이터가 너무 큽니다." },
        { status: 413 }
      );
    }

    const body = (await request.json().catch(() => null)) as {
      items?: unknown;
      email?: unknown;
      guestPassword?: unknown;
      depositorName?: unknown;
      delivery?: unknown;
      agreements?: {
        terms?: unknown;
        privacy?: unknown;
        purchase?: unknown;
      };
    } | null;

    const email = readOrderString(body?.email, 254);
    const emailNormalized = email.toLowerCase();
    if (!EMAIL_PATTERN.test(emailNormalized)) {
      return NextResponse.json(
        { ok: false, error: "INVALID_EMAIL", message: "이메일을 올바르게 입력해주세요." },
        { status: 400 }
      );
    }

    const guestPassword =
      typeof body?.guestPassword === "string" ? body.guestPassword : "";
    if (!isValidGuestPassword(guestPassword)) {
      return NextResponse.json(
        {
          ok: false,
          error: "INVALID_GUEST_PASSWORD",
          message:
            "주문조회 비밀번호는 공백 없이 10~16자, 영문/숫자/특수문자 중 2가지 이상 조합해주세요.",
        },
        { status: 400 }
      );
    }

    const depositorName = normalizeDepositorName(
      readOrderString(body?.depositorName, 40)
    );
    if (!isValidDepositorName(depositorName)) {
      return NextResponse.json(
        { ok: false, error: "INVALID_DEPOSITOR_NAME", message: "입금자명을 입력해주세요." },
        { status: 400 }
      );
    }

    if (
      body?.agreements?.terms !== true ||
      body.agreements.privacy !== true ||
      body.agreements.purchase !== true
    ) {
      return NextResponse.json(
        { ok: false, error: "AGREEMENT_REQUIRED", message: "필수 약관에 동의해주세요." },
        { status: 400 }
      );
    }

    const delivery = parseCheckoutDelivery(body?.delivery);
    if ("error" in delivery) {
      return NextResponse.json(
        { ok: false, error: "INVALID_DELIVERY", message: delivery.error },
        { status: 400 }
      );
    }

    const checkoutItems = parseCheckoutItems(body?.items);
    const resolvedItems = resolveCheckoutItems(
      checkoutItems,
      await getRegisteredProducts()
    );
    const itemSnapshots = resolvedItems.map(toOrderItemSnapshot);
    const amounts = calculateCheckoutAmounts(resolvedItems, {
      pointsToUse: 0,
      includeShipping: true,
    });
    const orderId = generateBankTransferOrderId(true);
    const depositDueAt = getDepositDueAt();
    const password = await hashGuestPassword(guestPassword);
    const emailHash = createHash("sha256")
      .update(emailNormalized, "utf8")
      .digest("hex");

    const db = getAdminDb();
    const orderRef = db.collection("orders").doc(orderId);
    const credentialRef = db.collection("guestOrderCredentials").doc(orderId);
    await db.runTransaction(async (transaction) => {
      const inventoryUpdates = await computeInventoryUpdates(
        db,
        transaction,
        itemSnapshots
      );
      transaction.create(orderRef, {
        userId: "",
        userEmail: email,
        userName: delivery.recipientName || "비회원 고객",
        isGuest: true,
        status: "pending",
        paymentMethod: "BANK_TRANSFER",
        paymentStatus: "WAITING_FOR_DEPOSIT",
        expectedAmount: amounts.finalTotal,
        depositorName,
        depositorNameNormalized: normalizeDepositorName(depositorName),
        depositDueAt,
        itemCount: itemSnapshots.reduce<number>(
          (sum, item) => sum + item.quantity,
          0
        ),
        items: itemSnapshots,
        amounts,
        source: "web-guest-bank-transfer",
        orderNo: orderId,
        delivery,
        payment: {
          provider: "bank-transfer",
          method: BANK_TRANSFER_ACCOUNT.methodLabel,
          requestedMethod: "TRANSFER",
          bank: BANK_TRANSFER_ACCOUNT.bankName,
          amount: amounts.finalTotal,
          requestedAt: FieldValue.serverTimestamp(),
        },
        agreements: {
          termsAcceptedAt: FieldValue.serverTimestamp(),
          privacyAcceptedAt: FieldValue.serverTimestamp(),
          purchaseConfirmedAt: FieldValue.serverTimestamp(),
        },
        reward: {
          points: 0,
          rate: 0,
          granted: false,
          reversed: false,
          method: BANK_TRANSFER_ACCOUNT.methodLabel,
        },
        inventory: {
          processed: true,
          processedAt: FieldValue.serverTimestamp(),
        },
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      writeInventoryUpdates(transaction, inventoryUpdates);
      transaction.create(credentialRef, {
        orderId,
        emailHash,
        passwordAlgorithm: password.algorithm,
        passwordSalt: password.salt,
        passwordHash: password.hash,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    revalidateProductCatalog();

    return NextResponse.json({
      ok: true,
      orderId,
      payablePrice: amounts.finalTotal,
      depositorName,
      depositDueAt: depositDueAt.toDate().toISOString(),
    });
  } catch (error) {
    const errorCode =
      error instanceof Error ? error.message : "GUEST_ORDER_FAILED";
    console.error("[orders/guest] failed", errorCode);
    return NextResponse.json(
      {
        ok: false,
        error: errorCode,
        message: checkoutOrderErrorMessage(error),
      },
      { status: checkoutOrderErrorStatus(error) }
    );
  }
}
