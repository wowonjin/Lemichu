#!/usr/bin/env python3
"""BUYMA export CSV → Cafe24 등록용 스테이징 JSON 전처리 (ST1).

입력: <input_dir>/products.csv + color_size_options.csv (BUYMA export, utf-8-sig)
출력: <input_dir>/staging_products.json + validation_report.md

사용법: python3 preprocess_buyma_to_cafe24.py [input_dir]
        (기본 input_dir: testset_prada_miumiu_celine_v1_0)

필드 스키마는 ST0 ④ 실검증(2026-08-18) 반영 — supply_price 필수.
카테고리 매핑은 마스터 tools/buyma_category_map.csv를 읽어 depth1(품목)까지만 정한다 —
몰 분류번호는 등록 시점에 (브랜드 × depth1)로 조회한다(전처리 문서 §9.3).
depth1=제외 코드는 스테이징에서 빠지고 리포트에 기록된다.
"""
import csv
import json
import re
import sys
from pathlib import Path

from check_product_names import validate_name

JPY_TO_KRW = 9.2          # 100엔 = 920원 고정 (제작계획 §5)
SALE_UNIT = 10000         # 판매가: 만원 단위 내림 (2026-08-18 대표 확정 — 마진 감소 감수)
PRICE_UNIT = 100          # 그 외(소비자가·사이즈 가산금): 100원 단위 반올림

COLOR_MAP = {
    "black": "블랙", "white": "화이트", "brown": "브라운", "blue": "블루",
    "grey": "그레이", "gray": "그레이", "navy": "네이비", "pink": "핑크",
    "denim blue": "데님블루", "black & white": "블랙&화이트",
    "blue sky": "스카이블루", "sky blue": "스카이블루",
    "purple": "퍼플", "ivory": "아이보리", "dark navy": "다크 네이비",
    "cream": "크림", "beige": "베이지", "charcoal": "차콜",
    "silver": "실버", "gold": "골드", "green": "그린", "red": "레드",
    "deep red": "딥 레드", "orange": "오렌지", "yellow": "옐로",
    "wine": "와인", "cognac": "코냑", "camel": "카멜", "caramel": "카라멜",
    "carmel": "카라멜", "khaki": "카키", "ecru": "에크루",
    "mint": "민트", "rose": "로즈", "baby pink": "베이비 핑크",
    "pink beige": "핑크 베이지", "beige brown": "베이지 브라운",
    "dark brown": "다크 브라운", "red & black": "레드&블랙",
    "white black": "화이트&블랙", "black+white": "블랙&화이트",
    "faded denim": "페이디드 데님", "denim": "데님",
    "one color": "단일 색상", "色指定なし": "색상 지정 없음",
}

# 재고상태 추정 매핑 (테스트셋 실측: 0=수량없음, 1=수량없음, 2=보유수량 기입)
# BUYMA 의미(0=품절, 1=재고있음·주문후확인, 2=수량관리) — ST2 등록 결과로 재확인
STOCK_MAP = {"0": "soldout", "1": "available", "2": "quantity_managed"}

DECOR_RE = re.compile(r"[★☆■□◆◇●○♪†※＊*]")
JP_KANA_RE = re.compile(r"[぀-ヿ]")  # 히라가나·가타카나

MEASURE_COLS = [
    "기장", "어깨너비", "가슴둘레", "소매길이", "허리둘레", "엉덩이둘레", "총길이",
    "너비", "밑위", "인심", "허벅지둘레", "밑단둘레", "스커트길이", "탑", "언더",
    "높이", "굽높이", "부츠통둘레", "발볼", "옆폭", "손잡이", "스트랩", "깊이",
    "세로", "가로", "두께", "길이", "탑세로", "탑가로", "둘레", "손목둘레",
    "다이얼세로", "다이얼가로", "프레임세로", "프레임가로", "렌즈세로", "렌즈가로",
    "안경다리", "전체길이", "최대너비", "머리둘레", "챙", "직경",
]


def sale_price(jpy):
    """엔화 단가 → 판매가. 고정 환율 환산 후 만원 단위 **내림**(반올림 아님)."""
    return int(int(jpy) * JPY_TO_KRW) // SALE_UNIT * SALE_UNIT


def convert_price(jpy):
    """판매가 외 금액(소비자가·사이즈 가산금) — 100원 단위 반올림.

    만원 내림은 판매가 끝자리 정책이다. 소비자가는 브랜드 정가 표기라 내리면 할인율이 왜곡되고,
    가산금은 1만 미만이 0으로 사라져 사이즈 업차지 자체가 소멸한다.
    """
    return round(int(jpy) * JPY_TO_KRW / PRICE_UNIT) * PRICE_UNIT


def parse_size(raw):
    """'L +50,000' / 'FR38+30,000\\' / 'XS + 10,000円' → (기본사이즈, 가산금JPY)."""
    s = raw.replace("在庫確認", "").replace("\\", "").strip()
    if "+" not in s:
        return s, 0
    base, _, extra = s.partition("+")
    digits = re.sub(r"[^\d]", "", extra)
    return base.strip(), int(digits) if digits else 0


def parse_color(raw):
    """'White + 70,000'처럼 색상명에 포함된 가산금을 분리한다."""
    s = raw.replace("\\", "").strip()
    match = re.match(r"^(.*?)\s*\+\s*([\d,]+)\s*(?:円)?$", s)
    if not match:
        return s, 0
    return match.group(1).strip(), int(match.group(2).replace(",", ""))


def normalize_color(raw, notes):
    ko = COLOR_MAP.get(raw.strip().lower())
    if ko is None:
        notes.append(f"미등록 색상명 '{raw}' — 원문 유지")
        return f"기타 색상 ({raw.strip()})"
    return ko


def clean_name(raw):
    s = DECOR_RE.sub(" ", raw)
    s = s.replace("【", " ").replace("】", " ")
    return re.sub(r"\s+", " ", s).strip()


def load_category_map():
    path = Path(__file__).parent / "buyma_category_map.csv"
    with open(path, encoding="utf-8-sig") as f:
        return {r["buyma_category"]: r for r in csv.DictReader(f)}


def load_brand_map():
    path = Path(__file__).parent / "buyma_brand_map.csv"
    with open(path, encoding="utf-8-sig") as f:
        return {
            r["brand_original"]: (r["brand_ko"], r["brand_en"])
            for r in csv.DictReader(f)
        }


def load_rewritten_names(input_dir):
    """<input_dir>/product_names_rewritten.csv — 있으면 재작성 상품명·키워드 후보 병합."""
    path = input_dir / "product_names_rewritten.csv"
    if not path.exists():
        return {}
    with open(path, encoding="utf-8-sig") as f:
        return {r["custom_product_code"]: r for r in csv.DictReader(f)}


def selftest():
    assert sale_price(145000) == 1330000        # 1,334,000 → 만원 내림
    assert sale_price(6500) == 50000            # 59,800 → 50,000 (경계 직전 최대 손실)
    assert sale_price(10870) == 100000          # 100,004 → 100,000 (경계 직후)
    assert convert_price(10) == 100             # 92 → 100원 단위 반올림(가산금·소비자가)
    assert convert_price(5000) == 46000         # 가산금은 만원 내림 대상 아님
    assert parse_size("L +50,000") == ("L", 50000)
    assert parse_size("FR38+30,000\\") == ("FR38", 30000)
    assert parse_size("XS + 10,000円") == ("XS", 10000)
    assert parse_size("M 在庫確認 +30,000") == ("M", 30000)
    assert parse_size("IT44") == ("IT44", 0)
    assert parse_color("White + 70,000") == ("White", 70000)
    assert parse_color("BLACK+WHITE") == ("BLACK+WHITE", 0)
    assert clean_name("【PRADA】★ブラッシュドレザー Monolith") == "PRADA ブラッシュドレザー Monolith"
    assert JP_KANA_RE.search("ブーツ") and not JP_KANA_RE.search("Monolith boots")


def main():
    selftest()
    base = Path(__file__).parent
    input_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else base / "testset_prada_miumiu_celine_v1_0"

    with open(input_dir / "products.csv", encoding="utf-8-sig") as f:
        products = list(csv.DictReader(f))
    with open(input_dir / "color_size_options.csv", encoding="utf-8-sig") as f:
        option_rows = list(csv.DictReader(f))
    category_map = load_category_map()
    brand_map = load_brand_map()
    rewritten = load_rewritten_names(input_dir)

    options_by_pid = {}
    for r in option_rows:
        options_by_pid.setdefault(r["상품ID"], []).append(r)

    product_ids = {p["상품ID"] for p in products}
    assert len(product_ids) == len(products), "상품ID 중복"
    orphan_options = sorted(set(options_by_pid) - product_ids)

    staging, report_issues, excluded = [], [], []
    for p in products:
        pid = p["상품ID"]
        notes = []

        brand = brand_map.get(p["브랜드명"])
        if brand is None:
            notes.append(f"미등록 브랜드 '{p['브랜드명']}'")
            brand = (p["브랜드명"], p["브랜드명"])

        cat = category_map.get(p["카테고리"])
        if cat is None:
            notes.append(f"카테고리 미매핑 (buyma {p['카테고리']})")
            category_path = None
        elif cat["depth1"] == "제외":
            excluded.append((f"buyma-{pid}", cat["buyma_name_ja"]))
            continue
        else:
            category_path = f"{cat['depth1']}>{cat['depth2']}"

        images = [p[f"상품이미지{i}"].strip() for i in range(1, 21) if p[f"상품이미지{i}"].strip()]

        options = []
        source_options = sorted(
            options_by_pid.get(pid, []), key=lambda x: int(x["정렬순서"] or 0)
        )
        for r in source_options:
            size, surcharge_jpy = parse_size(r["사이즈명칭"])
            color, color_surcharge_jpy = parse_color(r["색상명칭"])
            measurements = {c: r[c] for c in MEASURE_COLS if r.get(c, "").strip()}
            options.append({
                "color": normalize_color(color, notes),
                "color_original": r["색상명칭"],
                "size": size,
                "surcharge_krw": (
                    convert_price(surcharge_jpy + color_surcharge_jpy)
                    if surcharge_jpy or color_surcharge_jpy else 0
                ),
                "stock_status": STOCK_MAP.get(r["재고상태"], f"unknown({r['재고상태']})"),
                "quantity": int(r["보유재고수량"]) if r["보유재고수량"].strip() else None,
                "measurements": measurements,  # 상세페이지 치수표 소재 (§5)
            })
        if not options:
            notes.append("옵션 0건")
        if not images:
            notes.append("이미지 0건")
        if all(o["stock_status"] == "soldout" for o in options) and options:
            notes.append("전 옵션 품절")

        code = f"buyma-{pid}"
        rw = rewritten.get(code)
        if rw:
            name = rw["product_name_ko"]
            name_issues = validate_name(name, brand[0])
            if name_issues:
                notes.append("재작성 상품명 규칙 위반: " + " / ".join(name_issues))
            keywords = [k.strip() for k in rw["keywords_candidate"].split(";") if k.strip()]
        else:
            name = clean_name(p["상품명"])       # 재작성 전 초안 — 등록 금지
            name_issues = ["재작성 없음"]
            keywords = []
        item = {
            "custom_product_code": code,
            "product_name": name,
            "product_name_original": p["상품명"],
            "needs_ai_rewrite": bool(name_issues),
            "keywords_candidate": keywords,       # 검색광고 API 검색량 검증 전 — 태그 확정 금지
            "brand_ko": brand[0],
            "brand_en": brand[1],
            "model": p["모델"].strip(),
            "buyma_category": p["카테고리"],
            "category_path": category_path,
            "price": sale_price(p["단가"]),
            "price_jpy": int(p["단가"]),
            "retail_price": convert_price(p["참고가격"]) if p["참고가격"].strip() else None,
            "duty_included": p["관세포함"] == "1",
            "display": "F",                       # 진열안함 — 대표 검수 후 개시 (K7)
            "selling": "F",
            "description_source": p["상품설명"],   # AI 재작성 소재 — 바이마 문구 포함 원문
            "option_supplement_source": p["색상사이즈보충설명"],
            "tags_raw": p["태그"],                # 바이마 태그 코드 — 참고 소재
            "images": images,
            "options": options,
            "notes": notes,
            "source_product": p,                  # 원본 112컬럼 무손실 보존
            "source_options": source_options,     # 원본 55컬럼 옵션행 무손실 보존
        }
        staging.append(item)
        if notes:
            report_issues.append((item["custom_product_code"], notes))

    out_json = input_dir / "staging_products.json"
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(staging, f, ensure_ascii=False, indent=2)

    n_opts = sum(len(s["options"]) for s in staging)
    assert n_opts == len(option_rows) - sum(len(options_by_pid[o]) for o in orphan_options)

    lines = [
        "# 전처리 검증 리포트",
        "",
        f"- 입력: `{input_dir.name}` — 상품 {len(products)}건 / 옵션 {len(option_rows)}행",
        f"- 출력: `{out_json.name}` — 상품 {len(staging)}건 / 옵션 {n_opts}건",
        f"- 환산: 100엔={round(JPY_TO_KRW * 100)}원 고정 — 판매가는 {SALE_UNIT:,}원 단위 **내림**,"
        f" 소비자가·사이즈 가산금은 {PRICE_UNIT}원 단위 반올림",
        f"- 조인 고아 옵션(상품 없음): {len(orphan_options)}건" + (f" — {orphan_options}" if orphan_options else ""),
        f"- 이관 제외(바이마 4472 등): {len(excluded)}건" + (f" — {excluded}" if excluded else ""),
        f"- 카테고리 경로 매핑: {sum(1 for s in staging if s['category_path'])}/{len(staging)}건"
        f" — 몰 분류는 등록 시 (브랜드 × depth1) 조회로 결정(전처리 §9.3)",
        f"- 상품명 재작성 적용: {sum(1 for s in staging if s['custom_product_code'] in rewritten)}/{len(staging)}건"
        f" / 규칙 위반·미재작성(등록 금지): {sum(1 for s in staging if s['needs_ai_rewrite'])}건",
        f"- 키워드 후보 보유: {sum(1 for s in staging if s['keywords_candidate'])}건 — **검색광고 API 검색량 검증 전(태그 확정 금지)**",
        f"- 사이즈 가산금 있는 옵션: {sum(1 for s in staging for o in s['options'] if o['surcharge_krw'])}건 (JPY 동일 환율 환산)",
        "- 재고상태 코드 의미(0=품절/1=재고있음/2=수량관리)는 실측 추정 — ST2 등록 시 재확인",
        "",
        "## 상품별 이슈",
        "",
    ]
    if report_issues:
        for code, notes in report_issues:
            lines.append(f"- `{code}`: " + " / ".join(notes))
    else:
        lines.append("- 없음")
    (input_dir / "validation_report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(f"완료: 상품 {len(staging)}건 → {out_json}")
    print(f"리포트: {input_dir / 'validation_report.md'}")


if __name__ == "__main__":
    main()
