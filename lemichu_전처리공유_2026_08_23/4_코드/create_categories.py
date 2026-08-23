#!/usr/bin/env python3
"""브랜드 1차 카테고리 트리 생성 (전처리 문서 §9). 구 품목 트리(v2.0)를 대체.

사용법: python3 create_categories.py [브랜드 ...]   # 생략 시 배치 브랜드 전체

- 트리: 구매대행(62) > 브랜드 > 품목. 브랜드가 실제 보유한 품목만, 품목 1종이면 품목 노드 없음
  (상품은 브랜드 노드에 직배치). 품목 순서는 전 브랜드 공통 고정(§9.2)
- 생성 범위 = 이관 배치 브랜드만. 상품이 없는 브랜드 분류를 미리 깔지 않는다 —
  잔여 15브랜드는 ST4 배치 확대 때 브랜드 선별표와 함께 추가
- 노출: 브랜드·품목 노드 모두 use_display=T·use_main=F — 헤더 메뉴(use_main=T)는 최상위
  구매대행·중고명품만. 브랜드는 각 최상위 안의 하위 필터로 렌더(구 품목 대분류가 있던 자리)
- 실스펙: 계층=parent_category_no, 노출=use_display T/F, 단건 GET 즉시 반영,
  DELETE 시 상품-카테고리 연결도 해제(구 트리 정리는 §9.4 3단계)
- 멱등: category_tree.json 대장 1차 기준(목록 조회는 읽기 지연) — 노드 생성 즉시 기록
- 브랜드(Collection) brand_code는 brand_map.csv에 유지, 생성한 브랜드 분류번호는 category_no 열에 기입
"""
import csv
import json
import sys
from collections import defaultdict
from pathlib import Path

from preprocess_buyma_to_cafe24 import BRAND_MAP
from register_products import Api

BASE = Path(__file__).parent
TREE_LEDGER = BASE / "category_tree.json"
MAP_CSV = BASE / "buyma_category_map.csv"
BRAND_CSV = BASE / "brand_map.csv"
EXPORT = next(BASE.parent.glob("items_12200692_*")) / "buyma_products_utf8.csv"

TOP = "구매대행 신품"      # 대장 경로 키 — 몰 노출 명칭은 "구매대행"(62번)
ITEM_ORDER = ["가방", "지갑·소품", "신발", "의류", "모자", "액세서리"]
# 이번 이관 배치 = 확정 3사
BATCH = [("프라다", "PRADA"), ("미우미우", "MIU MIU"), ("셀린느", "CELINE")]


def brand_items():
    """출품중 상품 실분포에서 브랜드별 보유 품목(depth1) 산출 — 기타·미매핑은 제외(등록 게이트와 동일)."""
    with open(MAP_CSV, encoding="utf-8-sig") as f:
        depth1 = {r["buyma_category"]: r["depth1"] for r in csv.DictReader(f)}
    got = defaultdict(set)
    with open(EXPORT, encoding="utf-8") as f:
        for p in csv.DictReader(f):
            if p["공개상태"] != "出品中":
                continue
            brand = BRAND_MAP.get(p["브랜드명"])
            d1 = depth1.get(p["카테고리"])
            if brand and d1 in ITEM_ORDER:
                got[brand[0]].add(d1)
    return {ko: [i for i in ITEM_ORDER if i in items] for ko, items in got.items()}


def ensure_category(api, ledger, path, name, parent_no, use_main="F"):
    if path in ledger:
        print(f"SKIP {path} = {ledger[path]} (대장)")
        return ledger[path]
    req = {"category_name": name, "use_display": "T", "use_main": use_main}
    if parent_no:
        req["parent_category_no"] = parent_no
    made = api.call("POST", "/admin/categories", {"shop_no": 1, "request": req})
    no = made["category"]["category_no"]
    assert made["category"]["use_display"] == "T"
    ledger[path] = no
    TREE_LEDGER.write_text(json.dumps(ledger, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"생성 {path} = {no} (use_main={use_main})")
    return no


def ensure_brand_code(api, row):
    """브랜드(Collection) — 기존 코드 있으면 유지."""
    if row.get("brand_code"):
        return row["brand_code"]
    made = api.call("POST", "/admin/brands", {"shop_no": 1, "request": {
        "brand_name": row["brand_ko"], "search_keyword": row["brand_en"], "use_brand": "T"}})
    row["brand_code"] = made["brand"]["brand_code"]
    print(f"생성 브랜드 {row['brand_ko']} = {row['brand_code']}")
    return row["brand_code"]


def main():
    only = sys.argv[1:]
    batch = [b for b in BATCH if not only or b[0] in only]
    assert batch, f"대상 브랜드 없음 — 배치: {[b[0] for b in BATCH]}"

    items = brand_items()
    api = Api()
    ledger = json.loads(TREE_LEDGER.read_text(encoding="utf-8"))
    top_no = ledger[TOP]

    with open(BRAND_CSV, encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    have = {r["brand_ko"]: r for r in rows}

    for ko, en in batch:
        row = have.get(ko)
        if row is None:
            row = {"brand_ko": ko, "brand_en": en, "brand_code": "",
                   "exhibit_category_no": "", "category_no": ""}
            rows.append(row)
            have[ko] = row
        ensure_brand_code(api, row)
        brand_no = ensure_category(api, ledger, f"{TOP}>{ko}", ko, top_no)
        row["category_no"] = str(brand_no)
        mine = items.get(ko, [])
        if len(mine) < 2:
            print(f"  품목 노드 없음 ({ko}: {mine or '상품 없음'}) — 브랜드 노드 직배치")
            continue
        for it in mine:
            ensure_category(api, ledger, f"{TOP}>{ko}>{it}", it, brand_no)

    fields = ["brand_ko", "brand_en", "brand_code", "exhibit_category_no", "category_no"]
    with open(BRAND_CSV, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows([{k: r.get(k, "") for k in fields} for r in rows])
    print(f"\nbrand_map.csv 갱신 — 브랜드 분류번호 기입 {sum(1 for r in rows if r.get('category_no'))}/{len(rows)}")


if __name__ == "__main__":
    main()
