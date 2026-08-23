#!/usr/bin/env python3
"""전체 staging 데이터에서 검증 가능한 구조화 한국어 상품 콘텐츠를 생성한다."""

import csv
import html
import json
import re
import sys
from pathlib import Path

from check_product_names import validate_name

BASE = Path(__file__).resolve().parents[1]
DEFAULT_DIR = BASE / "2_중간산출물_전체편입"
ASCII_TOKEN_RE = re.compile(r"[A-Za-z][A-Za-z0-9.&'-]{1,}")
FORBIDDEN_ASCII = {
    "buyma", "sale", "new", "popular", "tracking", "follow", "official",
    "authentic", "limited", "special", "price", "item", "product",
}
STOCK_LABELS = {
    "available": "구매 가능",
    "soldout": "품절",
    "quantity_managed": "수량 관리",
}


def unique(values):
    seen = set()
    result = []
    for value in values:
        key = value.lower()
        if value and key not in seen:
            seen.add(key)
            result.append(value)
    return result


def build_name(product):
    brand_ko = product["brand_ko"].strip()
    depth2 = (product.get("category_path") or "기타>상품").split(">")[-1].strip()
    brand_tokens = {
        token.lower()
        for token in ASCII_TOKEN_RE.findall(product.get("brand_en", ""))
    }
    source_tokens = unique(
        token
        for token in ASCII_TOKEN_RE.findall(
            html.unescape(product.get("product_name_original", ""))
        )
        if token.lower() not in brand_tokens
        and token.lower() not in FORBIDDEN_ASCII
        and not token.isdigit()
    )

    base = f"{brand_ko} {depth2}"
    selected = []
    for token in source_tokens:
        candidate = " ".join([base, *selected, token])
        if len(candidate) > 50:
            break
        selected.append(token)
        if len(selected) == 2:
            break
    name = " ".join([base, *selected])
    issues = validate_name(name, brand_ko)
    if issues:
        name = base[:50].rstrip()
        issues = validate_name(name, brand_ko)
    if issues:
        raise ValueError(
            f"{product['custom_product_code']} 상품명 생성 실패: {name} / {issues}"
        )
    return name


def option_lines(product):
    lines = []
    for option in product.get("options", []):
        label = " / ".join(
            part for part in [option.get("color"), option.get("size")] if part
        ) or "단일 옵션"
        details = [STOCK_LABELS.get(option.get("stock_status"), "재고 확인 필요")]
        if option.get("stock_status") == "quantity_managed":
            details.append(f"재고 {option.get('quantity') or 0}개")
        if option.get("surcharge_krw"):
            details.append(f"가산금 {int(option['surcharge_krw']):,}원")
        measurements = option.get("measurements") or {}
        if measurements:
            details.append(
                "실측 " + ", ".join(f"{key} {value}" for key, value in measurements.items())
            )
        lines.append(f"- {label}: {' / '.join(details)}")
    return lines


def build_translation(product, name):
    colors = unique(
        option.get("color", "").strip()
        for option in product.get("options", [])
        if option.get("color", "").strip()
    )
    sizes = unique(
        option.get("size", "").strip()
        for option in product.get("options", [])
        if option.get("size", "").strip()
    )
    category_path = product.get("category_path") or "기타>상품"
    description = [
        f"{name}입니다.",
        f"브랜드: {product['brand_ko']}",
        f"카테고리: {category_path.replace('>', ' > ')}",
        f"상품 코드: {product['custom_product_code']}",
        f"색상: {', '.join(colors) if colors else '상세 옵션 확인'}",
        f"사이즈: {', '.join(sizes) if sizes else '단일 사이즈'}",
        "관부가세: 상품가 포함"
        if product.get("duty_included")
        else "관부가세: 주문 전 별도 확인 필요",
    ]
    return {
        "description_ko": "\n".join(description),
        "option_supplement_ko": "\n".join(option_lines(product)),
    }


def main():
    input_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_DIR
    staging_path = input_dir / "staging_products.json"
    products = json.loads(staging_path.read_text(encoding="utf-8"))
    names = []
    translations = {}

    for product in products:
        name = build_name(product)
        code = product["custom_product_code"]
        names.append(
            {
                "custom_product_code": code,
                "product_name_ko": name,
                "keywords_candidate": ";".join(
                    unique(
                        [
                            product["brand_ko"],
                            *(product.get("category_path") or "").split(">"),
                        ]
                    )
                ),
            }
        )
        translations[code] = build_translation(product, name)

    with (input_dir / "product_names_rewritten.csv").open(
        "w", encoding="utf-8-sig", newline=""
    ) as file:
        writer = csv.DictWriter(
            file,
            fieldnames=[
                "custom_product_code",
                "product_name_ko",
                "keywords_candidate",
            ],
            quoting=csv.QUOTE_ALL,
            lineterminator="\r\n",
        )
        writer.writeheader()
        writer.writerows(names)

    (input_dir / "product_translations_ko.json").write_text(
        json.dumps(translations, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(
        f"한국어 콘텐츠 생성: 상품명 {len(names):,}건 / "
        f"상세·옵션 {len(translations):,}건 -> {input_dir}"
    )


if __name__ == "__main__":
    main()
