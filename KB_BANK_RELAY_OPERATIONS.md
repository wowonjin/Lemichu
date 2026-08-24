# KB 무통장입금 릴레이 운영 가이드

이 문서는 Android 서버폰이 KB 입금 알림을 전달하고 쇼핑몰 서버가 최종 결제 판정을 내리는 시스템의 배포·운영 절차다. 서버폰 번호와 Device Secret은 이 문서나 Git에 기록하지 않는다.

## 1. 서버 환경변수

배포 플랫폼의 암호화된 환경변수와 로컬 `.env.local`에만 다음 값을 설정한다.

```dotenv
KB_RELAY_DEVICE_ID=kb-server-phone-01
KB_RELAY_DEVICE_NAME=KB 입금 서버폰
KB_RELAY_DEVICE_PHONE=<서버폰 번호>
KB_RELAY_DEVICE_SECRET=<최소 32자 고엔트로피 Secret>
KB_RELAY_ACCOUNT_MASK=<실제 KB 문자에 표시되는 마스킹 계좌>
BANK_TRANSFER_DEPOSIT_DUE_HOURS=24
```

- `NEXT_PUBLIC_` 접두사를 절대 사용하지 않는다.
- Secret은 비밀번호 관리도구에서 32바이트 이상 난수로 생성한다.
- 같은 Secret을 서버 환경변수와 Android 설정 화면에 한 번씩 입력한다.
- Secret, 전체 SMS, 알림 원문, 서버폰 번호를 로그에 출력하지 않는다.

## 2. Firestore 배포와 기기 등록

```bash
firebase deploy --only firestore:rules,firestore:indexes
npm run bank-relay:device:check
npm run bank-relay:device:register
```

등록 스크립트는 `bankRelayDevices/kb-server-phone-01`에 이름, 전화번호, enabled 상태만 저장한다. Secret은 Firestore에 저장하지 않는다. `bankRelayNonces.expiresAt` TTL이 Firebase Console에서 활성화됐는지 확인한다.

## 3. 서버 API

- `POST /api/internal/bank-relay/deposits`
- `POST /api/internal/bank-relay/heartbeat`

두 API는 raw JSON body와 `X-Relay-Device`, `X-Relay-Timestamp`, `X-Relay-Nonce`, `X-Relay-Signature` HMAC 헤더가 모두 필요하다. 직접 브라우저나 고객 클라이언트에서 호출하지 않는다.

## 4. Android APK

자세한 빌드·설치 방법은 `kb-deposit-relay/README.md`를 따른다.

1. JDK 17과 Android SDK를 설치한다.
2. Android Studio에서 `kb-deposit-relay`를 연다.
3. release keystore는 저장소 밖에서 생성·보관한다.
4. `./gradlew test assembleDebug` 또는 서명된 release 빌드를 실행한다.
5. `adb install -r app/build/outputs/apk/debug/app-debug.apk`로 설치한다.
6. 앱 설정에서 HTTPS 운영 Server URL, Device ID, Device Name, 서버폰 번호, Device Secret을 입력한다.

## 5. 서버폰 권한과 Samsung 절전 설정

1. 앱 Wizard에서 `알림 접근 설정`을 열어 KB Deposit Relay를 허용한다.
2. 기본 문자 앱 또는 설치된 Samsung Messages/Google Messages를 선택한다.
3. Android 설정 → 배터리 → 백그라운드 사용 제한에서 앱을 절전/초절전 대상에서 제외한다.
4. 설정 → 앱 → KB Deposit Relay → 배터리에서 `제한 없음`을 선택한다.
5. 앱 대시보드에서 Notification Access, Server, KB Parser, Queue가 모두 정상인지 확인한다.

`READ_SMS`, `RECEIVE_SMS`, 접근성 권한은 사용하지 않는다.

## 6. 무송금 테스트

1. Android 개발 메뉴의 `KB 샘플 입금 테스트`를 실행한다.
2. 이벤트가 `isTest=true`로 queue에 저장되고 전송 완료되는지 확인한다.
3. 관리자 → 무통장입금에서 테스트 이벤트가 `무시`로 표시되는지 확인한다.
4. 어떤 주문도 `PAID`/`preparing`으로 바뀌지 않았는지 확인한다.

## 7. 실제 소액 송금 테스트

1. 서버폰에서 KB 거래통지 문자가 정상 수신되고 문자 앱 알림이 켜져 있는지 확인한다.
2. 쇼핑몰에서 테스트용 무통장 주문을 생성한다.
3. 입금자명을 `테스트홍길동`, 금액을 운영상 가능한 최소 금액(예: 1,000원)으로 정확히 저장한다.
4. 다른 계좌에서 쇼핑몰 KB 계좌로 같은 입금자명·금액을 송금한다.
5. Android 최근 이벤트가 `전송완료`가 되는지 확인한다.
6. 관리자 → 무통장입금에서 이벤트가 `자동매칭`인지 확인한다.
7. `bankDepositEvents/{eventHash}`가 `MATCHED`, 주문이 `paymentStatus=PAID`, `status=preparing`, 동일 `paymentReference`인지 확인한다.
8. 상품 재고와 포인트 ledger가 정확히 한 번만 변경됐는지 확인한다.
9. `npm run bank-relay:verify`로 이벤트-주문 일관성을 점검한다.

실제 송금은 환불/회계 절차를 준비한 운영자만 수행한다.

## 8. 실패·재전송 테스트

- 인터넷 OFF: 샘플 이벤트 생성 후 Room에서 `PENDING` 유지, 인터넷 ON 후 `SENT` 전환을 확인한다.
- 서버 DOWN/5xx: 이벤트가 `FAILED`로 남고 WorkManager 지수 backoff 후 재시도되는지 확인한다.
- 앱 강제 종료/재실행: stale `SENDING`이 복구되고 queue가 재개되는지 확인한다.
- 서버폰 재부팅: Notification Access 상태와 즉시 heartbeat, queue 재개를 확인한다.
- 동일 알림 2회: Room UNIQUE eventHash와 서버 문서 ID 중복방지로 주문/재고가 한 번만 처리되는지 확인한다.
- nonce 재사용/5분 초과 timestamp/잘못된 HMAC: API가 401을 반환하는지 확인한다.
- 동일 이름·금액 주문 2건: 이벤트가 `AMBIGUOUS`이고 자동 결제되지 않는지 확인한다.
- 금액/이름 불일치: `UNMATCHED`이고 자동 결제되지 않는지 확인한다.

## 9. 관리자 수동 매칭

`UNMATCHED` 또는 `AMBIGUOUS` 이벤트의 `확인`을 누르고 같은 금액의 대기 주문을 선택한다. 이름이 다르면 5자 이상의 확인 사유가 필수다. 수동 처리도 공통 결제 완료 transaction을 사용하며 `bankRelayAuditLogs`에 관리자, 주문, 이벤트, 사유를 기록한다.

## 10. 모니터링과 장애 대응

- 최근 heartbeat 30분 이내: 정상
- 30~60분: 주의
- 60분 초과: 오프라인
- Notification Access OFF 또는 pending queue 증가 시 서버폰을 즉시 확인한다.
- Secret 유출 의심 시 서버 환경변수와 Android Secret을 함께 교체하고 이전 Secret을 폐기한다.
- 이벤트를 임의 삭제하거나 주문을 직접 `PAID`로 수정하지 않는다. 미확인 이벤트는 관리자 수동 매칭 경로로 처리한다.

## 11. 검증 명령

```bash
npm run typecheck
npm test
npm run build
npm run bank-relay:verify
```

Firebase emulator 통합 테스트와 Android build/test는 JDK·Android SDK가 설치된 환경에서 실행한다. 물리 서버폰 알림 수신, 재부팅, 백그라운드 생존, 실제 송금 결과는 실제 기기에서 확인하기 전까지 `미검증`으로 취급한다.
