#!/usr/bin/env python3
"""전체 BUYMA CSV의 자연어 셀을 중복 제거하고 병렬 번역 배치로 분할한다."""

import csv
import hashlib
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

csv.field_size_limit(10**9)

PACKAGE = Path(__file__).resolve().parents[1]
WORKSPACE = PACKAGE.parent
OUT = PACKAGE / "5_전체번역"
INPUTS = OUT / "inputs"
PRODUCTS_CSV = WORKSPACE / "items.utf8.csv"
OPTIONS_CSV = WORKSPACE / "colorsizes.utf8.csv"
MAX_BATCH_CHARS = 70_000
MAX_BATCH_UNITS = 350

PRODUCT_TEXT_FIELDS = [
    "商品名",
    "ブランド名",
    "商品コメント",
    "色サイズ補足",
    "配送方法",
    "買付エリア",
    "買付都市",
    "買付ショップ",
    "発送エリア",
    "発送都市",
    "出品メモ",
    *[f"ブランド品番識別メモ{i}" for i in range(1, 11)],
    *[f"買付先名{i}" for i in range(1, 16)],
    *[f"買付先説明{i}" for i in range(1, 16)],
]
OPTION_TEXT_FIELDS = [
    "商品名",
    "サイズ名称",
    "サイズ単位",
    "色名称",
    "色サイズリプレイス",
]
LANGUAGE_RE = re.compile(r"[A-Za-z\u3040-\u30ff\u3400-\u9fff]")
URL_ONLY_RE = re.compile(r"^\s*https?://\S+\s*$", re.IGNORECASE)


def read_rows(path):
    with path.open(encoding="utf-8-sig", newline="") as file:
        reader = csv.DictReader(file)
        return reader.fieldnames or [], list(reader)


def normalize(value):
    return str(value or "").replace("\r\n", "\n").replace("\r", "\n").strip()


def unit_id(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:24]


def needs_model_translation(text):
    return bool(text) and not URL_ONLY_RE.fullmatch(text) and bool(LANGUAGE_RE.search(text))


def source_hash(path):
    digest = hashlib.sha256()
    with path.open("rb") as file:
        while chunk := file.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def main():
    product_columns, products = read_rows(PRODUCTS_CSV)
    option_columns, options = read_rows(OPTIONS_CSV)
    missing_product_fields = sorted(set(PRODUCT_TEXT_FIELDS) - set(product_columns))
    missing_option_fields = sorted(set(OPTION_TEXT_FIELDS) - set(option_columns))
    if missing_product_fields or missing_option_fields:
        raise ValueError(
            f"원본 컬럼 누락: products={missing_product_fields}, options={missing_option_fields}"
        )

    unit_contexts = defaultdict(set)
    occurrences = Counter()
    for row in products:
        for field in PRODUCT_TEXT_FIELDS:
            text = normalize(row[field])
            if not needs_model_translation(text):
                continue
            uid = unit_id(text)
            unit_contexts[(uid, text)].add(f"products.{field}")
            occurrences[uid] += 1
    for row in options:
        for field in OPTION_TEXT_FIELDS:
            text = normalize(row[field])
            if not needs_model_translation(text):
                continue
            uid = unit_id(text)
            unit_contexts[(uid, text)].add(f"options.{field}")
            occurrences[uid] += 1

    units = [
        {
            "id": uid,
            "text": text,
            "contexts": sorted(contexts),
            "occurrences": occurrences[uid],
        }
        for (uid, text), contexts in unit_contexts.items()
    ]
    units.sort(key=lambda unit: (-len(unit["text"]), unit["id"]))

    INPUTS.mkdir(parents=True, exist_ok=True)
    for old in INPUTS.glob("batch_*.json"):
        old.unlink()

    batches = []
    current = []
    current_chars = 0
    for unit in units:
        unit_chars = len(unit["text"])
        if current and (
            current_chars + unit_chars > MAX_BATCH_CHARS
            or len(current) >= MAX_BATCH_UNITS
        ):
            batches.append(current)
            current = []
            current_chars = 0
        current.append(unit)
        current_chars += unit_chars
    if current:
        batches.append(current)

    for index, batch in enumerate(batches, start=1):
        (INPUTS / f"batch_{index:03d}.json").write_text(
            json.dumps(batch, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    manifest = {
        "schemaVersion": 1,
        "productsSource": str(PRODUCTS_CSV),
        "optionsSource": str(OPTIONS_CSV),
        "productsSha256": source_hash(PRODUCTS_CSV),
        "optionsSha256": source_hash(OPTIONS_CSV),
        "productCount": len(products),
        "optionCount": len(options),
        "uniqueTranslationUnits": len(units),
        "translationOccurrences": sum(occurrences.values()),
        "batchCount": len(batches),
        "maxBatchChars": MAX_BATCH_CHARS,
        "maxBatchUnits": MAX_BATCH_UNITS,
        "productTextFields": PRODUCT_TEXT_FIELDS,
        "optionTextFields": OPTION_TEXT_FIELDS,
        "batches": [
            {
                "file": f"inputs/batch_{index:03d}.json",
                "unitCount": len(batch),
                "charCount": sum(len(unit["text"]) for unit in batch),
            }
            for index, batch in enumerate(batches, start=1)
        ],
    }
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "translation_manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(
        f"번역 배치 생성: 상품 {len(products):,} / 옵션 {len(options):,} / "
        f"고유 텍스트 {len(units):,} / 출현 {sum(occurrences.values()):,} / "
        f"배치 {len(batches):,}"
    )


if __name__ == "__main__":
    main()
