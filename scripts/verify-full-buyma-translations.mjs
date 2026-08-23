import { createHash } from "node:crypto";
import { createReadStream, writeFileSync } from "node:fs";
import path from "node:path";
import readline from "node:readline";
import {
  assertExpectedProject,
  getFirebaseAdminServices,
} from "./lib/firebase-admin.mjs";

const COLLECTION = "buyma_translated_source";
const sourcePath = path.resolve(
  "lemichu_전처리공유_2026_08_23",
  "5_전체번역",
  "translated_products.jsonl"
);
const reportPath = path.resolve(
  "lemichu_전처리공유_2026_08_23",
  "5_전체번역",
  "firebase_verification_report.md"
);
const expectedProject =
  process.env.FIREBASE_TARGET_PROJECT_ID || "lemichu-25c26";

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])])
    );
  }
  return value;
}

function hash(value) {
  return createHash("sha256")
    .update(JSON.stringify(canonicalize(value)))
    .digest("hex");
}

async function loadExpected() {
  const expected = new Map();
  const lines = readline.createInterface({
    input: createReadStream(sourcePath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });
  for await (const line of lines) {
    if (!line.trim()) continue;
    const document = JSON.parse(line);
    expected.set(document.id, {
      sourceHash: document.translationMeta.sourceHash,
      translationHash: document.translationMeta.translationHash,
      optionCount: document.sourceOptions.length,
      eligible: document.eligibleForOperations,
    });
  }
  return expected;
}

async function main() {
  const expected = await loadExpected();
  const { db, projectId } = getFirebaseAdminServices();
  assertExpectedProject(projectId, expectedProject);
  const found = new Set();
  const failures = [];
  let optionCount = 0;
  let eligibleCount = 0;

  const stream = db
    .collection(COLLECTION)
    .select(
      "sourceProduct",
      "translatedProduct",
      "sourceOptions",
      "translatedOptions",
      "translationMeta",
      "eligibleForOperations"
    )
    .stream();
  for await (const snapshot of stream) {
    const reference = expected.get(snapshot.id);
    if (!reference) {
      failures.push(`예상하지 않은 문서: ${snapshot.id}`);
      continue;
    }
    found.add(snapshot.id);
    const data = snapshot.data();
    const sourceHash = hash({
      product: data.sourceProduct,
      options: data.sourceOptions,
    });
    const translationHash = hash({
      product: data.translatedProduct,
      options: data.translatedOptions,
    });
    if (
      sourceHash !== reference.sourceHash ||
      sourceHash !== data.translationMeta?.sourceHash
    ) {
      failures.push(`원본 해시 불일치: ${snapshot.id}`);
    }
    if (
      translationHash !== reference.translationHash ||
      translationHash !== data.translationMeta?.translationHash
    ) {
      failures.push(`번역 해시 불일치: ${snapshot.id}`);
    }
    if (
      data.sourceOptions?.length !== reference.optionCount ||
      data.translatedOptions?.length !== reference.optionCount
    ) {
      failures.push(`옵션 수 불일치: ${snapshot.id}`);
    }
    if (Boolean(data.eligibleForOperations) !== reference.eligible) {
      failures.push(`운영 후보 판정 불일치: ${snapshot.id}`);
    }
    optionCount += data.sourceOptions?.length ?? 0;
    if (data.eligibleForOperations) eligibleCount += 1;
    if (found.size % 250 === 0) {
      console.log(`[buyma-full-verify] checked ${found.size}/${expected.size}`);
    }
  }

  for (const id of expected.keys()) {
    if (!found.has(id)) failures.push(`누락 문서: ${id}`);
  }
  if (found.size !== 5_099) {
    failures.push(`상품 수 불일치: expected=5099 actual=${found.size}`);
  }
  if (optionCount !== 27_462) {
    failures.push(`옵션 수 불일치: expected=27462 actual=${optionCount}`);
  }
  if (eligibleCount !== 1_342) {
    failures.push(`운영 후보 수 불일치: expected=1342 actual=${eligibleCount}`);
  }

  const report = [
    "# BUYMA 전체 번역 Firebase 검증",
    "",
    `- 프로젝트: \`${projectId}\``,
    `- 컬렉션: \`${COLLECTION}\``,
    `- 상품: ${found.size.toLocaleString()} / 5,099`,
    `- 옵션: ${optionCount.toLocaleString()} / 27,462`,
    `- 운영 후보: ${eligibleCount.toLocaleString()} / 1,342`,
    `- 원본·번역 전문 해시 오류: ${failures.length}`,
    `- 결과: ${failures.length === 0 ? "PASS" : "FAIL"}`,
    ...(failures.length > 0
      ? ["", "## 오류", "", ...failures.map((failure) => `- ${failure}`)]
      : []),
    "",
  ].join("\n");
  writeFileSync(reportPath, report, "utf8");
  if (failures.length > 0) {
    throw new Error(`Verification failed with ${failures.length} issue(s)`);
  }
  console.log("[buyma-full-verify] PASS products=5099 options=27462 eligible=1342");
}

main().catch((error) => {
  console.error(
    `[buyma-full-verify] failed: ${error instanceof Error ? error.message : error}`
  );
  process.exitCode = 1;
});
