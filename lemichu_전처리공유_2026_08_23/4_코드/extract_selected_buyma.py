#!/usr/bin/env python3
"""BUYMA 전체 export에서 브랜드 선별표의 편입 상품과 옵션을 무손실 추출한다."""

import csv
import sys
from collections import Counter
from pathlib import Path

csv.field_size_limit(10**9)

PACKAGE = Path(__file__).resolve().parents[1]
WORKSPACE = PACKAGE.parent
SELECTION_CSV = PACKAGE / "1_브랜드선별표" / "brand_selection.csv"
TEMPLATE_DIR = PACKAGE / "2_중간산출물_테스트셋30건"
DEFAULT_OUT = PACKAGE / "2_중간산출물_전체편입"


def read_rows(path, encoding="utf-8-sig"):
    with path.open(encoding=encoding, newline="") as file:
        reader = csv.DictReader(file)
        return reader.fieldnames or [], list(reader)


def translate_headers(rows, source_fields, target_fields):
    if len(source_fields) != len(target_fields):
        raise ValueError(
            f"컬럼 수 불일치: 원본 {len(source_fields)} / 템플릿 {len(target_fields)}"
        )
    key_map = dict(zip(source_fields, target_fields))
    return [
        {key_map[source]: row.get(source, "") for source in source_fields}
        for row in rows
    ]


def write_rows(path, fields, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as file:
        writer = csv.DictWriter(
            file, fieldnames=fields, quoting=csv.QUOTE_ALL, lineterminator="\r\n"
        )
        writer.writeheader()
        writer.writerows(rows)


def main():
    products_path = Path(sys.argv[1]) if len(sys.argv) > 1 else WORKSPACE / "items.utf8.csv"
    options_path = (
        Path(sys.argv[2]) if len(sys.argv) > 2 else WORKSPACE / "colorsizes.utf8.csv"
    )
    output_dir = Path(sys.argv[3]) if len(sys.argv) > 3 else DEFAULT_OUT

    _, selections = read_rows(SELECTION_CSV)
    included = {
        row["브랜드(원문)"]: int(row["건수"])
        for row in selections
        if row["판정"] == "편입"
    }
    expected_total = sum(included.values())

    product_source_fields, source_products = read_rows(products_path)
    option_source_fields, source_options = read_rows(options_path)
    product_target_fields, _ = read_rows(TEMPLATE_DIR / "products.csv")
    option_target_fields, _ = read_rows(TEMPLATE_DIR / "color_size_options.csv")

    products = translate_headers(
        source_products, product_source_fields, product_target_fields
    )
    options = translate_headers(source_options, option_source_fields, option_target_fields)

    selected_products = [
        row
        for row in products
        if row["공개상태"] == "出品中" and row["브랜드명"] in included
    ]
    selected_ids = {row["상품ID"] for row in selected_products}
    selected_options = [row for row in options if row["상품ID"] in selected_ids]

    if len(selected_ids) != len(selected_products):
        raise ValueError("선별 상품ID 중복")
    brand_counts = Counter(row["브랜드명"] for row in selected_products)
    mismatches = {
        brand: {"expected": expected, "actual": brand_counts.get(brand, 0)}
        for brand, expected in included.items()
        if brand_counts.get(brand, 0) != expected
    }
    if len(selected_products) != expected_total or mismatches:
        raise ValueError(
            f"선별표 건수 불일치: expected={expected_total}, "
            f"actual={len(selected_products)}, brands={mismatches}"
        )

    option_product_ids = {row["상품ID"] for row in selected_options}
    products_without_options = sorted(selected_ids - option_product_ids)
    orphan_selected_options = sorted(option_product_ids - selected_ids)

    write_rows(output_dir / "products.csv", product_target_fields, selected_products)
    write_rows(
        output_dir / "color_size_options.csv", option_target_fields, selected_options
    )

    report = [
        "# BUYMA 편입 데이터 추출 검증",
        "",
        f"- 원본 상품: {len(products):,}건",
        f"- 원본 옵션: {len(options):,}행",
        f"- 편입 브랜드: {len(included)}개",
        f"- 편입 상품: {len(selected_products):,}건 (선별표 기대 {expected_total:,}건)",
        f"- 편입 옵션: {len(selected_options):,}행",
        f"- 상품ID 중복: {len(selected_products) - len(selected_ids)}건",
        f"- 옵션 없는 상품: {len(products_without_options)}건",
        f"- 고아 옵션 상품ID: {len(orphan_selected_options)}건",
        "",
        "## 브랜드별 상품 수",
        "",
        *[
            f"- {brand}: {brand_counts.get(brand, 0):,}건"
            for brand in included
        ],
        "",
    ]
    (output_dir / "extraction_report.md").write_text(
        "\n".join(report), encoding="utf-8"
    )

    print(
        f"추출 완료: 상품 {len(selected_products):,}건 / "
        f"옵션 {len(selected_options):,}행 -> {output_dir}"
    )
    print(
        f"옵션 없는 상품 {len(products_without_options)}건 / "
        f"고아 옵션 {len(orphan_selected_options)}건"
    )


if __name__ == "__main__":
    main()
