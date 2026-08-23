#!/usr/bin/env python3
"""카페24 Admin API OAuth 2.0 인증 — ST0 ④ / 제작계획 §7 API 클라이언트 모듈의 인증부.

설정: tools/.cafe24_app.json (gitignore — mall_id·client_id·client_secret·redirect_uri·scope)
토큰: tools/.cafe24_tokens.json (gitignore — 자동 저장·갱신)

사용법:
  python3 cafe24_auth.py url           # 1. 인증 코드 발급 URL 출력 → 브라우저에서 열기
  python3 cafe24_auth.py token <code>  # 2. 주소창의 code= 값으로 토큰 발급·저장
  python3 cafe24_auth.py test          # 3. 검증 호출 (상품 목록 1건) — 만료 시 자동 갱신
"""
import base64
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

BASE = Path(__file__).parent
APP_FILE = BASE / ".cafe24_app.json"
TOKEN_FILE = BASE / ".cafe24_tokens.json"


def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def api_base(app):
    return f"https://{app['mall_id']}.cafe24api.com/api/v2"


def request_token(app, grant):
    basic = base64.b64encode(f"{app['client_id']}:{app['client_secret']}".encode()).decode()
    req = urllib.request.Request(
        f"{api_base(app)}/oauth/token",
        data=urllib.parse.urlencode(grant).encode(),
        headers={"Authorization": f"Basic {basic}",
                 "Content-Type": "application/x-www-form-urlencoded"},
    )
    try:
        with urllib.request.urlopen(req) as res:
            tokens = json.load(res)
    except urllib.error.HTTPError as e:
        sys.exit(f"토큰 발급 실패 HTTP {e.code}: {e.read().decode()}")
    tokens["_saved_at"] = int(time.time())
    TOKEN_FILE.write_text(json.dumps(tokens, indent=2), encoding="utf-8")
    print(f"토큰 저장: {TOKEN_FILE.name} (access 2시간 / refresh 2주 유효)")
    return tokens


def access_token(app):
    """저장된 access token 반환 — 만료(발급 110분 경과) 시 refresh로 자동 갱신."""
    if not TOKEN_FILE.exists():
        sys.exit("토큰 없음 — 먼저 `cafe24_auth.py url` → `token <code>` 순서로 발급")
    tokens = load(TOKEN_FILE)
    if time.time() - tokens["_saved_at"] > 110 * 60:
        print("access token 만료 임박 — refresh 갱신")
        tokens = request_token(app, {"grant_type": "refresh_token",
                                     "refresh_token": tokens["refresh_token"]})
    return tokens["access_token"]


def api_get(app, path):
    req = urllib.request.Request(
        f"{api_base(app)}{path}",
        headers={"Authorization": f"Bearer {access_token(app)}",
                 "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req) as res:
            return json.load(res), dict(res.headers)
    except urllib.error.HTTPError as e:
        sys.exit(f"API 호출 실패 HTTP {e.code}: {e.read().decode()}")


def main():
    app = load(APP_FILE)
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""

    if cmd == "url":
        q = urllib.parse.urlencode({
            "response_type": "code", "client_id": app["client_id"], "state": "st0",
            "redirect_uri": app["redirect_uri"], "scope": app["scope"],
        })
        print("브라우저에서 열기 (대표운영자 로그인 → 동의 → 주소창 code= 복사, 유효 1분):\n")
        print(f"https://{app['mall_id']}.cafe24.com/api/v2/oauth/authorize?{q}")
    elif cmd == "token":
        if len(sys.argv) < 3:
            sys.exit("사용법: cafe24_auth.py token <인증코드>")
        request_token(app, {"grant_type": "authorization_code", "code": sys.argv[2],
                            "redirect_uri": app["redirect_uri"]})
    elif cmd == "test":
        body, headers = api_get(app, "/admin/products?limit=1")
        n = len(body.get("products", []))
        print(f"호출 성공 — 상품 {n}건 반환")
        print(f"레이트리밋 헤더 X-Api-Call-Limit: {headers.get('X-Api-Call-Limit', '(없음)')}")
        if n:
            p = body["products"][0]
            print(f"샘플: product_no={p.get('product_no')} / {p.get('product_name')}")
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main()
