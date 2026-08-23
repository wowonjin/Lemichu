#!/usr/bin/env python3
"""검증된 번역 사전을 원본 5,099상품/27,462옵션에 무손실로 결합한다."""

import csv
import hashlib
import json
import re
from collections import defaultdict
from pathlib import Path

csv.field_size_limit(10**9)

PACKAGE = Path(__file__).resolve().parents[1]
WORKSPACE = PACKAGE.parent
ROOT = PACKAGE / "5_전체번역"
PRODUCTS_CSV = WORKSPACE / "items.utf8.csv"
OPTIONS_CSV = WORKSPACE / "colorsizes.utf8.csv"
SELECTION_CSV = PACKAGE / "1_브랜드선별표" / "brand_selection.csv"
MANIFEST_PATH = ROOT / "translation_manifest.json"
TRANSLATIONS_PATH = ROOT / "translations_ko.json"
PRODUCT_OUTPUT = ROOT / "items.translated.ko.csv"
OPTION_OUTPUT = ROOT / "colorsizes.translated.ko.csv"
JSONL_OUTPUT = ROOT / "translated_products.jsonl"
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


def translate(value, translations):
    text = normalize(value)
    if not needs_model_translation(text):
        return text
    uid = unit_id(text)
    if uid not in translations:
        raise KeyError(f"번역 누락: {uid} {text[:120]}")
    return translations[uid]


def canonical_hash(value):
    return hashlib.sha256(
        json.dumps(
            value, ensure_ascii=False, sort_keys=True, separators=(",", ":")
        ).encode("utf-8")
    ).hexdigest()


def write_translated_csv(path, columns, rows, text_fields, translations):
    output_columns = [
        column
        for source in columns
        for column in (
            [source, f"{source}_KO"] if source in text_fields else [source]
        )
    ]
    with path.open("w", encoding="utf-8-sig", newline="") as file:
        writer = csv.DictWriter(
            file, fieldnames=output_columns, quoting=csv.QUOTE_ALL, lineterminator="\r\n"
        )
        writer.writeheader()
        for row in rows:
            output = {}
            for column in columns:
                output[column] = row[column]
                if column in text_fields:
                    output[f"{column}_KO"] = translate(row[column], translations)
            writer.writerow(output)


def main():
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    translations = json.loads(TRANSLATIONS_PATH.read_text(encoding="utf-8"))
    product_text_fields = manifest["productTextFields"]
    option_text_fields = manifest["optionTextFields"]
    product_columns, products = read_rows(PRODUCTS_CSV)
    option_columns, options = read_rows(OPTIONS_CSV)
    _, selections = read_rows(SELECTION_CSV)
    selection_by_brand = {
        row["브랜드(원문)"]: row["판정"] for row in selections
    }

    write_translated_csv(
        PRODUCT_OUTPUT,
        product_columns,
        products,
        set(product_text_fields),
        translations,
    )
    write_translated_csv(
        OPTION_OUTPUT,
        option_columns,
        options,
        set(option_text_fields),
        translations,
    )

    options_by_product = defaultdict(list)
    for option in options:
        options_by_product[option["商品ID"]].append(option)

    source_product_ids = {product["商品ID"] for product in products}
    orphan_option_ids = sorted(set(options_by_product) - source_product_ids)
    document_sizes = []
    eligible_count = 0
    translated_option_count = 0
    with JSONL_OUTPUT.open("w", encoding="utf-8", newline="\n") as file:
        for product in products:
            product_id = product["商品ID"]
            source_options = options_by_product.get(product_id, [])
            translated_product = {
                field: translate(product[field], translations)
                for field in product_text_fields
            }
            translated_options = [
                {
                    "並び順": option["並び順"],
                    **{
                        field: translate(option[field], translations)
                        for field in option_text_fields
                    },
                }
                for option in source_options
            ]
            decision = selection_by_brand.get(product["ブランド名"], "미분류")
            eligible = decision == "편입" and product["公開ステータス"] == "出品中"
            if eligible:
                eligible_count += 1
            translated_option_count += len(translated_options)
            document = {
                "id": f"buyma-{product_id}",
                "sourceSystem": "buyma",
                "schemaVersion": 1,
                "selectionDecision": decision,
                "eligibleForOperations": eligible,
                "sourceProduct": product,
                "translatedProduct": translated_product,
                "sourceOptions": source_options,
                "translatedOptions": translated_options,
                "translationMeta": {
                    "engine": "cursor-grok-4.6-xhigh-fast",
                    "status": "complete",
                    "sourceHash": canonical_hash(
                        {"product": product, "options": source_options}
                    ),
                    "translationHash": canonical_hash(
                        {
                            "product": translated_product,
                            "options": translated_options,
                        }
                    ),
                },
            }
            encoded = json.dumps(document, ensure_ascii=False, separators=(",", ":"))
            size = len(encoded.encode("utf-8"))
            if size >= 1_000_000:
                raise ValueError(f"Firestore 문서 크기 초과: {document['id']} {size:,} bytes")
            document_sizes.append((size, document["id"]))
            file.write(encoded + "\n")

    document_sizes.sort(reverse=True)
    report = {
        "productCount": len(products),
        "optionCount": len(options),
        "translatedProductCount": len(products),
        "translatedOptionCount": translated_option_count,
        "eligibleForOperations": eligible_count,
        "orphanOptionProductIds": orphan_option_ids,
        "maxDocumentBytes": document_sizes[0][0],
        "maxDocumentId": document_sizes[0][1],
        "topDocumentSizes": [
            {"id": doc_id, "bytes": size}
            for size, doc_id in document_sizes[:20]
        ],
    }
    (ROOT / "translated_catalog_report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(
        f"전체 번역 결합 완료: 상품 {len(products):,} / 옵션 {translated_option_count:,} / "
        f"운영 후보 {eligible_count:,} / 최대 문서 {document_sizes[0][0]:,} bytes"
    )


if __name__ == "__main__":
    main()
