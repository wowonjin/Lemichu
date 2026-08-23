#!/usr/bin/env python3
"""재작성 상품명 규칙 자동 검사기 (제작계획 §5 키워드·태그 파이프라인 3단계).

검사 규칙: 글자 수(공백 포함 50자 이내) / 일본어(가나) 잔존 / 바이마·광고성 금지 문구 /
장식 특수문자 / 브랜드 선두 표기 / 동일 단어 중복 / 연속 공백.

단독 실행: python3 check_product_names.py <재작성CSV> <스테이징JSON>
전처리 파이프라인(preprocess_buyma_to_cafe24.py)이 validate_name()을 임포트해 병합 시 재검사한다.
"""
import csv
import json
import re
import sys

MAX_LEN = 50
KANA_RE = re.compile(r"[぀-ヿ]")
DECOR_RE = re.compile(r"[★☆■□◆◇●○♪†※＊【】\[\]()!?~♥❤]")
FORBIDDEN = [
    # 바이마 이관 잔재
    "바이마", "buyma", "追跡", "関税", "送料", "日本未入荷", "入手困難",
    # 광고성·과장 (검색 노이즈 + EP 품질 기준)
    "SALE", "세일", "핫딜", "인기", "대인기", "착용", "연예인", "한정",
]


def validate_name(name, brand_ko):
    issues = []
    if len(name) > MAX_LEN:
        issues.append(f"{len(name)}자 — {MAX_LEN}자 초과")
    if KANA_RE.search(name):
        issues.append("일본어(가나) 잔존")
    if DECOR_RE.search(name):
        issues.append("장식 특수문자 포함")
    if not name.startswith(brand_ko):
        issues.append(f"브랜드 '{brand_ko}' 선두 표기 아님")
    low = name.lower()
    for w in FORBIDDEN:
        if w.lower() in low:
            issues.append(f"금지 문구 '{w}'")
    tokens = name.split()
    dup = {t for t in tokens if tokens.count(t) > 1}
    if dup:
        issues.append(f"단어 중복 {sorted(dup)}")
    if "  " in name:
        issues.append("연속 공백")
    return issues


def selftest():
    assert validate_name("프라다 리나일론 블루종 재킷", "프라다") == []
    assert any("초과" in i for i in validate_name("프라다 " + "가" * 50, "프라다"))
    assert any("가나" in i for i in validate_name("프라다 ブルゾン 재킷", "프라다"))
    assert any("선두" in i for i in validate_name("리나일론 프라다 재킷", "프라다"))
    assert any("금지" in i for i in validate_name("프라다 세일 재킷", "프라다"))
    assert any("중복" in i for i in validate_name("프라다 재킷 재킷", "프라다"))


def main():
    selftest()
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    with open(sys.argv[1], encoding="utf-8-sig") as f:
        rewritten = {r["custom_product_code"]: r for r in csv.DictReader(f)}
    with open(sys.argv[2], encoding="utf-8") as f:
        staging = {s["custom_product_code"]: s for s in json.load(f)}

    missing = set(staging) - set(rewritten)
    extra = set(rewritten) - set(staging)
    fails = 0
    for code, row in rewritten.items():
        if code in extra:
            continue
        issues = validate_name(row["product_name_ko"], staging[code]["brand_ko"])
        if issues:
            fails += 1
            print(f"FAIL {code}: {row['product_name_ko']}")
            for i in issues:
                print(f"     - {i}")
    print(f"\n검사 {len(rewritten)}건 — 통과 {len(rewritten) - fails} / 실패 {fails}"
          f" / 스테이징 미커버 {len(missing)}건" + (f" {sorted(missing)}" if missing else "")
          + (f" / 스테이징에 없는 코드 {sorted(extra)}" if extra else ""))
    sys.exit(1 if fails or missing else 0)


if __name__ == "__main__":
    main()
