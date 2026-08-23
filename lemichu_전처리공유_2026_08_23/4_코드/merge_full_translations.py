#!/usr/bin/env python3
"""병렬 번역 출력을 전수 검증하고 단일 번역 사전으로 병합한다."""

import json
import re
import sys
from collections import Counter
from pathlib import Path

PACKAGE = Path(__file__).resolve().parents[1]
ROOT = PACKAGE / "5_전체번역"
INPUTS = ROOT / "inputs"
OUTPUTS = ROOT / "outputs"
URL_RE = re.compile(r"https?://[^\s\"'<>]+", re.IGNORECASE)
NUMBER_RE = re.compile(r"\d+(?:[.,]\d+)*")
# 품번·모델명만 검사한다. .5cm 같은 치수 조각과 2color 같은 옵션 표기는 제외.
SKU_RE = re.compile(r"(?<![A-Za-z0-9])[A-Za-z]{2,}[-_/]?\d{2,}[A-Za-z0-9_./-]*")
KANA_RE = re.compile(r"[\u3040-\u30fa\u30fd-\u30ff]")
NUMBER_WORD_RE = re.compile(
    r"[一二三四五六七八九十百千万億한두세네다섯여섯일곱여덟아홉열]"
)


def fold_number_words(text):
    table = str.maketrans(
        {
            "一": "1",
            "二": "2",
            "三": "3",
            "四": "4",
            "五": "5",
            "六": "6",
            "七": "7",
            "八": "8",
            "九": "9",
            "十": "10",
            "한": "1",
            "두": "2",
            "세": "3",
            "네": "4",
        }
    )
    return (
        str(text)
        .replace("하나", "1")
        .replace("둘", "2")
        .replace("셋", "3")
        .translate(table)
    )


def normalized_numbers(text):
    return Counter(
        value.replace(",", "").rstrip(".")
        for value in NUMBER_RE.findall(fold_number_words(text))
    )


def normalized_skus(text):
    return Counter(value.lower().rstrip(".-/") for value in SKU_RE.findall(str(text)))


def main():
    manifest = json.loads(
        (ROOT / "translation_manifest.json").read_text(encoding="utf-8")
    )
    all_translations = {}
    issues = []
    kana_residual = []

    for batch_info in manifest["batches"]:
        batch_name = Path(batch_info["file"]).stem.replace("batch_", "")
        input_path = ROOT / batch_info["file"]
        output_path = OUTPUTS / f"batch_{batch_name}.json"
        if not output_path.exists():
            issues.append(f"batch {batch_name}: 출력 파일 없음")
            continue
        try:
            input_units = json.loads(input_path.read_text(encoding="utf-8"))
            output = json.loads(output_path.read_text(encoding="utf-8"))
        except Exception as error:
            issues.append(f"batch {batch_name}: JSON 파싱 실패 {error}")
            continue

        if str(output.get("batch", "")).zfill(3) != batch_name:
            issues.append(f"batch {batch_name}: batch 메타 불일치")
        rows = output.get("translations")
        if not isinstance(rows, list):
            issues.append(f"batch {batch_name}: translations 배열 없음")
            continue

        expected = {unit["id"]: unit for unit in input_units}
        actual = {}
        for row in rows:
            uid = str(row.get("id", ""))
            ko = row.get("ko")
            if uid in actual:
                issues.append(f"batch {batch_name}: 중복 ID {uid}")
                continue
            if not isinstance(ko, str) or not ko.strip():
                issues.append(f"batch {batch_name}: 빈 번역 {uid}")
                continue
            actual[uid] = ko.strip()

        missing = sorted(set(expected) - set(actual))
        extra = sorted(set(actual) - set(expected))
        if missing:
            issues.append(f"batch {batch_name}: 누락 ID {len(missing)}개 {missing[:5]}")
        if extra:
            issues.append(f"batch {batch_name}: 추가 ID {len(extra)}개 {extra[:5]}")

        for uid in sorted(set(expected) & set(actual)):
            source = expected[uid]["text"]
            translated = actual[uid]
            if Counter(URL_RE.findall(source)) != Counter(URL_RE.findall(translated)):
                issues.append(f"batch {batch_name}: URL 보존 실패 {uid}")
            source_numbers = normalized_numbers(source)
            translated_numbers = normalized_numbers(translated)
            missing_numbers = source_numbers - translated_numbers
            if missing_numbers and not NUMBER_WORD_RE.search(translated):
                # 1枚→한 장, 三本線→3선처럼 수사가 남아 있으면 허용하고,
                # 가격·치수·연도 숫자만 실제 누락으로 본다.
                leftover = {
                    key: count
                    for key, count in missing_numbers.items()
                    if len(key) >= 2
                }
                if leftover:
                    issues.append(
                        f"batch {batch_name}: 숫자 보존 실패 {uid} {leftover}"
                    )
            missing_skus = normalized_skus(source) - normalized_skus(translated)
            unresolved_skus = {}
            translated_lower = translated.lower()
            for sku, count in missing_skus.items():
                digits = "".join(ch for ch in sku if ch.isdigit())
                if digits and digits in translated_lower:
                    continue
                unresolved_skus[sku] = count
            if unresolved_skus:
                issues.append(
                    f"batch {batch_name}: 코드 보존 실패 {uid} {unresolved_skus}"
                )
            if KANA_RE.search(translated):
                kana_residual.append(
                    {"batch": batch_name, "id": uid, "ko": translated[:300]}
                )
            all_translations[uid] = translated

    expected_total = manifest["uniqueTranslationUnits"]
    if len(all_translations) != expected_total:
        issues.append(
            f"전체 번역 수 불일치: expected={expected_total}, actual={len(all_translations)}"
        )

    report = {
        "expectedUnits": expected_total,
        "translatedUnits": len(all_translations),
        "batchCount": manifest["batchCount"],
        "issueCount": len(issues),
        "kanaResidualCount": len(kana_residual),
        "issues": issues,
        "kanaResidual": kana_residual,
    }
    (ROOT / "translation_validation_report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    if issues:
        print(f"번역 병합 실패: 이슈 {len(issues)}건")
        for issue in issues[:30]:
            print(f"- {issue}")
        sys.exit(1)

    (ROOT / "translations_ko.json").write_text(
        json.dumps(all_translations, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(
        f"번역 병합 완료: {len(all_translations):,}/{expected_total:,} / "
        f"가나 잔존 {len(kana_residual):,}건"
    )


if __name__ == "__main__":
    main()
