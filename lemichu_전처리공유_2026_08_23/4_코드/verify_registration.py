#!/usr/bin/env python3
"""등록 결과 검증 (ST2) — 스테이징 JSON 대비 API 실데이터 전수 비교.

사용법: python3 verify_registration.py <staging.json> [custom_product_code ...]

- 대상: register_log.csv 대장의 OK 상품 (PARTIAL은 미완 — 재등록 대상으로 별도 표기)
- 비교: 상품명·자체코드·가격 3종·브랜드·카테고리(브랜드 × depth1 — 전처리 §9)·대표이미지·추가이미지 수·
  품목별 재고 방식/수량/사이즈 가산금 (팬텀 조합 = 판매 차단 확인)
- 추가 이미지 조회는 embed=additionalimages 전용 (상품 필드 additional_image는 항상 빈 값 — 실스펙 함정)
- 읽기 지연 수 분(실측) — 등록 직후 실행하면 거짓 실패 가능, 수 분 대기 후 실행
- 결과: <staging 폴더>/verify_report.md + stdout, 불일치 있으면 exit 1
"""
import csv
import json
import sys
from pathlib import Path

from reassign_categories import TREE_LEDGER, target_no
from register_products import Api, load_brand_map

LEDGER = json.loads(TREE_LEDGER.read_text(encoding="utf-8"))


def num_eq(api_val, expected):
    if api_val is None:
        return expected in (None, 0)
    return float(api_val) == float(expected or 0)


def verify_product(api, s, no, brand_map):
    diffs = []
    p = api.call("GET", f"/admin/products/{no}?embed=additionalimages")["product"]

    checks = [
        ("상품명", p["product_name"] == s["product_name"]),
        ("자체코드", p["custom_product_code"] == s["custom_product_code"]),
        ("판매가", num_eq(p["price"], s["price"])),
        ("공급가", num_eq(p["supply_price"], s["price"])),
        ("소비자가", num_eq(p["retail_price"], s["retail_price"])),
        # 진열·판매 상태는 검수 트랙 관리 항목 — 2026-08-18 몰 화면 검수용 진열 개시(테스트셋 한정
        # 예외)로 등록 시점의 F/F와 어긋난다. 여기서는 비교하지 않고 리포트에 현재 값만 남긴다
        ("브랜드", p["brand_code"] == brand_map.get(s["brand_ko"], "")),
        # 브랜드 1차 트리(전처리 §9) — 상품 분류는 (브랜드 × depth1) 조회. 구 대응표 열은 폐기 대상
        ("카테고리", target_no(LEDGER, s["brand_ko"], (s["category_path"] or "").split(">")[0])
         in [c["category_no"] for c in p["category"] or []]),
        ("대표이미지", bool(p["detail_image"])),
        ("추가이미지수", len(p.get("additionalimages") or []) == max(len(s["images"]) - 1, 0)),
    ]
    diffs += [name for name, ok in checks if not ok]

    variants = api.call("GET", f"/admin/products/{no}/variants")["variants"]
    by_combo = {}
    for v in variants:
        vo = {x["name"]: x["value"] for x in v["options"]}
        by_combo[(vo["색상"], vo["사이즈"])] = v
    for o in s["options"]:
        v = by_combo.pop((o["color"], o["size"]), None)
        if v is None:
            diffs.append(f"품목 누락 {o['color']}/{o['size']}")
            continue
        if o["stock_status"] == "available":
            ok = v["use_inventory"] == "F"
        elif o["stock_status"] == "quantity_managed":
            ok = v["use_inventory"] == "T" and v["quantity"] == (o["quantity"] or 0)
        else:  # soldout·unknown → 판매 차단(수량 0)
            ok = v["use_inventory"] == "T" and v["quantity"] == 0
        if not ok:
            diffs.append(f"재고 {o['color']}/{o['size']} ({o['stock_status']} vs "
                         f"use_inventory={v['use_inventory']} qty={v['quantity']})")
        if not num_eq(v.get("additional_amount"), o["surcharge_krw"]):
            diffs.append(f"가산금 {o['color']}/{o['size']} ({o['surcharge_krw']} vs {v.get('additional_amount')})")
    for combo, v in by_combo.items():  # 스테이징에 없는 조합 = 팬텀 — 판매 차단이어야 정상
        if not (v["use_inventory"] == "T" and v["quantity"] == 0):
            diffs.append(f"팬텀 조합 미차단 {combo[0]}/{combo[1]}")
    return diffs, f"display={p['display']}/selling={p['selling']}"


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    staging_path = Path(sys.argv[1])
    targets = set(sys.argv[2:])
    staging = json.load(open(staging_path, encoding="utf-8"))
    with open(staging_path.parent / "register_log.csv", encoding="utf-8-sig") as f:
        ledger = {}  # 마지막 상태 우선 (OK/PARTIAL 누적 대장)
        for r in csv.DictReader(f):
            if r["status"] in ("OK", "PARTIAL"):
                ledger[r["custom_product_code"]] = (r["product_no"], r["status"])

    api = Api()
    brand_map = load_brand_map()
    lines, n_pass, n_fail, skipped = [], 0, 0, []
    for s in staging:
        code = s["custom_product_code"]
        if targets and code not in targets:
            continue
        entry = ledger.get(code)
        if entry is None or entry[1] != "OK":
            skipped.append(f"{code} ({'대장 없음' if entry is None else 'PARTIAL — 재등록 필요'})")
            continue
        diffs, state = verify_product(api, s, entry[0], brand_map)
        if diffs:
            n_fail += 1
            line = f"FAIL {code} product_no={entry[0]} [{state}]: " + " / ".join(diffs)
        else:
            n_pass += 1
            line = f"PASS {code} product_no={entry[0]} [{state}]"
        print(line)
        lines.append(line)

    summary = f"검증 {n_pass + n_fail}건 — PASS {n_pass} / FAIL {n_fail} / 미검증 {len(skipped)}"
    print("\n" + summary)
    for x in skipped:
        print("미검증:", x)
    report = ["# 등록 검증 리포트", "", f"- 대상: `{staging_path.name}` — {summary}", ""]
    report += [f"- {x}" for x in lines]
    if skipped:
        report += ["", "## 미검증"] + [f"- {x}" for x in skipped]
    (staging_path.parent / "verify_report.md").write_text("\n".join(report) + "\n", encoding="utf-8")
    sys.exit(1 if n_fail else 0)


if __name__ == "__main__":
    main()
