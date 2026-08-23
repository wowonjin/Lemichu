#!/usr/bin/env python3
"""스테이징 JSON → 카페24 상품 등록 (ST2). 제작계획 §7 "등록 스크립트".

사용법: python3 register_products.py <staging.json> <custom_product_code ...>
        (코드 생략 시 전체 등록)

- 멱등 2중: ① 로컬 대장(register_log.csv)의 OK/PARTIAL 우선 ② API 목록 조회 백스톱.
  목록 조회는 생성 후 수 분간 누락될 수 있어(실측) 대장이 1차 기준이다
- 전 상품 진열안함·판매안함(display/selling F) 등록 — 대표 검수 후 진열 (K7)
- 카테고리: (브랜드 × depth1) 조회로 결정(전처리 §9.3) — 브랜드 트리 미생성·depth1 미매핑은
  등록 차단(SKIP). 대응표의 분류번호 열·임시 카테고리 방식은 폐기
- 브랜드: brand_map.csv(create_categories.py 산출)의 brand_code 적용 — 미등록 브랜드는 차단
- 재고: available=재고관리 안함(구매대행 주문 후 확보) / soldout=수량0 / quantity_managed=수량N
- 이미지: 대표=products/images 업로드 후 경로 연결(A타입) / 추가=additionalimages에 base64 직접
- 레이트리밋·네트워크: 호출 간 0.5s, 429 지수 백오프, 일시 네트워크 오류 재시도
- 결과 대장: <staging 폴더>/register_log.csv 누적. 생성 후 중도 실패는 PARTIAL(product_no 보존)
- 상세설명(description)은 ST5 템플릿 단계에서 일괄 반영 — 여기선 비움
"""
import base64
import csv
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

import cafe24_auth as ca

THROTTLE = 0.5
BRAND_CSV = Path(__file__).parent / "brand_map.csv"
TOP = "구매대행 신품"      # 대장 경로 키 (create_categories.TOP과 동일 — 순환 import 회피)


class Api:
    def __init__(self):
        self.app = ca.load(ca.APP_FILE)
        self.base = ca.api_base(self.app)

    def call(self, method, path, payload=None):
        for attempt in range(5):
            time.sleep(THROTTLE)
            req = urllib.request.Request(
                self.base + path,
                data=json.dumps(payload).encode() if payload else None,
                method=method,
                headers={"Authorization": f"Bearer {ca.access_token(self.app)}",
                         "Content-Type": "application/json"})
            try:
                with urllib.request.urlopen(req) as res:
                    return json.load(res)
            except urllib.error.HTTPError as e:
                body = e.read().decode()
                if e.code == 429:
                    time.sleep(2 ** attempt)
                    continue
                raise RuntimeError(f"{method} {path} → HTTP {e.code}: {body[:300]}")
            except (urllib.error.URLError, ConnectionError, OSError):
                time.sleep(2 ** attempt)  # broken pipe 등 일시 오류 — 실측 발생
        raise RuntimeError(f"{method} {path} → 재시도 초과")


def load_brand_map():
    """brand_ko → brand_code — create_categories.py 산출."""
    with open(BRAND_CSV, encoding="utf-8-sig") as f:
        return {r["brand_ko"]: r["brand_code"] for r in csv.DictReader(f)}


def category_for(s):
    """(브랜드 × depth1) → 몰 분류번호. 품목 노드가 없으면 브랜드 노드(전처리 §9.3)."""
    ledger = json.loads((Path(__file__).parent / "category_tree.json").read_text(encoding="utf-8"))
    depth1 = (s["category_path"] or "").split(">")[0]
    return (ledger.get(f"{TOP}>{s['brand_ko']}>{depth1}")
            or ledger.get(f"{TOP}>{s['brand_ko']}"))


def exists(api, code):
    got = api.call("GET", f"/admin/products?custom_product_code={code}")
    products = got.get("products", [])
    return products[0]["product_no"] if products else None


def attach_images(api, no, urls):
    """대표 = 업로드 후 경로 연결(A타입, 4규격 자동 리사이즈) / 추가 = base64 직접 (실스펙 확정)."""
    blobs = []
    for url in urls:
        with urllib.request.urlopen(url) as res:
            blobs.append(base64.b64encode(res.read()).decode())
    got = api.call("POST", "/admin/products/images", {"requests": [{"image": blobs[0]}]})
    detail = "/" + got["images"][0]["path"].split("/", 5)[-1]  # https://host/pg…/mallid/web/… → /web/…
    api.call("PUT", f"/admin/products/{no}", {"shop_no": 1, "request": {
        "image_upload_type": "A", "detail_image": detail}})
    extras = blobs[1:20]
    for i in range(0, len(extras), 5):  # 요청 크기 제한 대비 5장 단위
        api.call("POST", f"/admin/products/{no}/additionalimages", {"shop_no": 1, "request": {
            "additional_image": extras[i:i + 5]}})
    return len(blobs)


def inventory_fields(opt):
    if opt["stock_status"] == "available":
        return {"use_inventory": "F"}
    if opt["stock_status"] == "quantity_managed":
        return {"use_inventory": "T", "quantity": opt["quantity"] or 0}
    return {"use_inventory": "T", "quantity": 0}  # soldout·미상은 판매 차단이 안전측


def register(api, s, brand_map, ledger, log):
    code = s["custom_product_code"]
    if s["needs_ai_rewrite"]:
        log(code, "", "SKIP", "상품명 재작성 미완 — 등록 금지")
        return
    category_no = category_for(s)
    if category_no is None:
        log(code, "", "SKIP", f"카테고리 조회 실패 — 등록 게이트 차단 ({s['brand_ko']}·{s['category_path']})")
        return
    if s["brand_ko"] not in brand_map:
        log(code, "", "SKIP", f"브랜드 미등록 '{s['brand_ko']}' — brand_map.csv 갱신 필요")
        return
    if code in ledger:
        log(code, ledger[code], "SKIP", "대장 기등록(OK/PARTIAL)")
        return
    if (no := exists(api, code)):
        log(code, no, "SKIP", "API 조회 기등록")
        return

    made = api.call("POST", "/admin/products", {"shop_no": 1, "request": {
        "product_name": s["product_name"],
        "custom_product_code": code,
        "price": str(s["price"]),
        "supply_price": str(s["price"]),  # 공급가 정책 미정 — 판매가 동일값 (실스펙 절)
        **({"retail_price": str(s["retail_price"])} if s["retail_price"] else {}),
        "display": "F", "selling": "F",
        "brand_code": brand_map[s["brand_ko"]],
        "add_category_no": [{"category_no": category_no}],  # 상품당 분류 1개(§1)
    }})
    no = made["product"]["product_no"]

    try:
        n_images = attach_images(api, no, s["images"])

        colors = sorted({o["color"] for o in s["options"]})
        sizes = sorted({o["size"] for o in s["options"]})
        try:
            api.call("POST", f"/admin/products/{no}/options", {"shop_no": 1, "request": {
                "has_option": "T", "option_type": "T", "option_list_type": "S",
                "options": [
                    {"option_name": "색상", "option_value": [{"option_text": c} for c in colors]},
                    {"option_name": "사이즈", "option_value": [{"option_text": z} for z in sizes]},
                ]}})
        except RuntimeError as e:
            # 네트워크 재시도가 이미 성공한 POST를 중복 전송하면 422 — 기생성이면 정상 진행 (실발생)
            if "422" not in str(e) or "option is being used" not in str(e):
                raise

        by_combo = {(o["color"], o["size"]): o for o in s["options"]}
        variants = api.call("GET", f"/admin/products/{no}/variants")["variants"]
        phantom = 0
        for v in variants:
            vo = {x["name"]: x["value"] for x in v["options"]}
            opt = by_combo.get((vo["색상"], vo["사이즈"]))
            if opt is None:  # 원본에 없는 조합 — 판매 차단
                fields, phantom = {"use_inventory": "T", "quantity": 0}, phantom + 1
            else:
                fields = dict(inventory_fields(opt))
                if opt["surcharge_krw"]:
                    fields["additional_amount"] = str(opt["surcharge_krw"])
            api.call("PUT", f"/admin/products/{no}/variants/{v['variant_code']}",
                     {"shop_no": 1, "request": fields})
    except Exception as e:
        log(code, no, "PARTIAL", f"생성 후 중도 실패 — {str(e)[:150]}")
        return

    note = f"이미지 {n_images} 옵션 {len(s['options'])} 품목 {len(variants)}"
    if phantom:
        note += f" 팬텀조합 차단 {phantom}"
    log(code, no, "OK", note)


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    staging_path = Path(sys.argv[1])
    targets = sys.argv[2:]
    staging = json.load(open(staging_path, encoding="utf-8"))
    if targets:
        staging = [s for s in staging if s["custom_product_code"] in targets]
        missing = set(targets) - {s["custom_product_code"] for s in staging}
        assert not missing, f"스테이징에 없는 코드: {missing}"

    api = Api()
    brand_map = load_brand_map()
    log_path = staging_path.parent / "register_log.csv"
    new_file = not log_path.exists()
    ledger = {}
    if not new_file:
        with open(log_path, encoding="utf-8-sig") as f:
            for r in csv.DictReader(f):
                if r["status"] in ("OK", "PARTIAL"):
                    ledger[r["custom_product_code"]] = r["product_no"]
    with open(log_path, "a", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f)
        if new_file:
            w.writerow(["custom_product_code", "product_no", "status", "note"])

        def log(code, no, status, note):
            w.writerow([code, no, status, note])
            f.flush()
            print(f"{status:4} {code} product_no={no} {note}")

        for s in staging:
            try:
                register(api, s, brand_map, ledger, log)
            except Exception as e:
                log(s["custom_product_code"], "", "FAIL", str(e)[:200])

    print(f"\n대장: {log_path}")


if __name__ == "__main__":
    main()
