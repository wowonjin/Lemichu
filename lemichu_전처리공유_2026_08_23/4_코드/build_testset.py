"""BUYMA export -> 이관 테스트 데이터셋 추출.

PRADA / MiuMiu / CELINE 각 10개, 총 30개. 선정 기준은 '변형 커버리지' —
이관 스크립트가 깨질 수 있는 데이터 패턴(옵션 규모, 측정 컬럼 패턴, 이미지 수,
HTML 엔티티, 품절 옵션, 결측 필드 등)이 최대한 고르게 섞이도록 그리디 선택한다.

출력은 원본과 동일한 112/55 컬럼 구조. 실행: python3 tools/build_testset.py
"""
import collections
import csv
import os
import re
import sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(BASE, "items_12200692_20260729A14A3C")
OUT = os.path.join(BASE, "tools", "testset_prada_miumiu_celine_v1_0")
BRANDS = ["PRADA", "MiuMiu", "CELINE"]
PER_BRAND = 10

csv.field_size_limit(10**9)


def bucket(n, edges):
    """n이 속한 구간 라벨. edges=[4,9,14] -> '0-4','5-9','10-14','15+'"""
    lo = 0
    for e in edges:
        if n <= e:
            return f"{lo}-{e}"
        lo = e + 1
    return f"{lo}+"


def features(p, opts, meas_cols):
    """이관 시 분기를 만드는 데이터 특성 집합."""
    imgs = sum(1 for i in range(1, 21) if p[f"상품이미지{i}"])
    parts = sum(1 for i in range(1, 11) if p[f"브랜드품번{i}"])
    price = int(p["단가"]) if p["단가"].isdigit() else 0
    filled = tuple(sorted(k for k in meas_cols if any(o[k] for o in opts)))
    f = {
        f"cat:{p['카테고리']}",
        f"meas:{'+'.join(filled) or 'none'}",
        f"opt:{bucket(len(opts), [1, 4, 9])}",
        f"color:{'multi' if len({o['색상명칭'] for o in opts}) > 1 else 'single'}",
        f"size:{'multi' if len({o['사이즈명칭'] for o in opts}) > 1 else 'single'}",
        f"img:{bucket(imgs, [0, 4, 9, 14])}",
        f"price:{bucket(price, [99999, 199999, 399999])}",
        f"partno:{parts}",
        f"ship:{p['배송방법']}",
        f"season:{'none' if p['시즌'] == '0' else 'set'}",
        f"duty:{p['관세포함']}",
        f"suppl:{'y' if p['색상사이즈보충설명'] else 'n'}",
        f"tag:{'y' if p['태그'] else 'n'}",
        f"desc:{bucket(len(p['상품설명']), [230, 400])}",
    }
    if re.search(r"&[a-zA-Z]+;|&#\d+;", p["상품명"] + p["상품설명"]):
        f.add("htmlentity:y")
    if any(o["재고상태"] == "0" for o in opts):
        f.add("soldout:y")
    if any(o["재고상태"] == "2" for o in opts):
        f.add("stock2:y")
    if any(o["보유재고수량"] for o in opts):
        f.add("onhand:y")
    if p["구매처URL1"]:
        f.add("srcurl:y")
    return f


# 카테고리는 종류가 50개를 넘어 30개 표본으로 전수 커버가 불가능하다.
# 다 담으려 들면 구조적 변형(옵션·측정·품절 등)을 밀어내므로 가중치를 낮춘다.
GROUP_WEIGHT = {"cat": 0.2}


def select(cands, quota):
    """브랜드 라운드로빈 그리디 set-cover. 점수 = 새로 덮는 특성의 가중치 합."""
    covered, picked = set(), {b: [] for b in BRANDS}
    for _ in range(quota):
        for b in BRANDS:
            pool = [c for c in cands[b] if c[0] not in {x[0] for x in picked[b]}]
            if not pool:
                continue
            best = max(
                pool,
                key=lambda c: (
                    sum(GROUP_WEIGHT.get(f.split(":")[0], 1.0) for f in c[2] - covered),
                    -int(c[0]),  # 동점 시 상품ID 오름차순으로 결정론적 선택
                ),
            )
            picked[b].append(best)
            covered |= best[2]
    return picked, covered


def main():
    with open(os.path.join(SRC, "buyma_products_utf8.csv"), encoding="utf-8") as f:
        products = list(csv.DictReader(f))
    with open(os.path.join(SRC, "buyma_color_size_options_utf8.csv"), encoding="utf-8") as f:
        reader = csv.DictReader(f)
        opt_cols = reader.fieldnames
        options = list(reader)

    by_pid = collections.defaultdict(list)
    for o in options:
        by_pid[o["상품ID"]].append(o)
    meas_cols = opt_cols[12:]  # 착장/치수 측정 컬럼 43개

    cands = {b: [] for b in BRANDS}
    freq = collections.Counter()
    for p in products:
        brand = p["브랜드명"].split("(")[0]
        if brand not in BRANDS or p["공개상태"] != "出品中":
            continue
        opts = by_pid[p["상품ID"]]
        if not opts:  # 옵션 없는 상품은 조인 테스트가 불가능하므로 제외
            continue
        fs = features(p, opts, meas_cols)
        cands[brand].append((p["상품ID"], p, fs))
        freq.update(fs)

    for b in BRANDS:
        if len(cands[b]) < PER_BRAND:
            sys.exit(f"{b} 후보 부족: {len(cands[b])}개")

    picked, covered = select(cands, PER_BRAND)
    pids = [c[0] for b in BRANDS for c in picked[b]]
    assert len(pids) == len(set(pids)) == PER_BRAND * len(BRANDS)

    os.makedirs(OUT, exist_ok=True)
    order = {pid: i for i, pid in enumerate(pids)}
    write(os.path.join(OUT, "products.csv"), list(products[0].keys()),
          sorted((c[1] for b in BRANDS for c in picked[b]), key=lambda r: order[r["상품ID"]]))
    opt_rows = [o for pid in pids for o in by_pid[pid]]
    write(os.path.join(OUT, "color_size_options.csv"), opt_cols, opt_rows)

    print(f"상품 {len(pids)}행, 옵션 {len(opt_rows)}행 -> {OUT}")
    print(f"특성 커버리지 {len(covered)}/{len(freq)} ({len(covered) / len(freq):.0%})")
    missed = collections.Counter(f.split(":")[0] for f in set(freq) - covered)
    if missed:
        print("미커버 특성:", dict(missed))
    for b in BRANDS:
        print(f"  {b}: " + ", ".join(c[0] for c in picked[b]))


def write(path, cols, rows):
    with open(path, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, cols, quoting=csv.QUOTE_ALL, lineterminator="\r\n")
        w.writeheader()
        w.writerows(rows)


if __name__ == "__main__":
    assert bucket(0, [0, 4, 9]) == "0-0" and bucket(7, [0, 4, 9]) == "5-9"
    assert bucket(30, [0, 4, 9]) == "10+"
    main()
