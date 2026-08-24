# KB Deposit Relay (Android)

KB 메시지 알림에서 입금 정보만 파싱해 HMAC 인증 HTTPS webhook으로 전달하는 전용 Android 앱입니다. `READ_SMS`, `RECEIVE_SMS`, 접근성 권한을 사용하지 않습니다. 선택한 메시지 앱의 package를 먼저 확인한 뒤 알림 extras를 메모리에서 읽으며, 원문 알림/SMS는 저장·로그·업로드하지 않습니다.

## 준비 사항

- JDK 17
- Android Studio 최신 안정판
- Android SDK Platform 37, SDK Build Tools 36.0.0
- Gradle 9.6.0 (최초 wrapper 생성에만 필요)
- 실제 검증용 Android 기기와 `adb`
- 서버에서 등록한 device ID/Device Secret 및 HTTPS 서버 URL

프로젝트는 AGP 9.4.0의 built-in Kotlin, Kotlin/Compose compiler 2.4.10, Compose BOM 2026.06.00을 사용합니다.

이 작업 환경에는 JDK/Android SDK/Gradle이 없어 wrapper JAR을 생성할 수 없었습니다. 바이너리를 임의로 만들지 않고 `gradle/wrapper/gradle-wrapper.properties`만 포함했습니다. JDK 17과 Gradle을 설치한 뒤 프로젝트 루트에서 다음을 한 번 실행해 공식 wrapper JAR과 스크립트를 생성하세요.

```text
gradle wrapper --gradle-version 9.6.0
```

그 후 Windows에서는 `gradlew.bat`, macOS/Linux에서는 `./gradlew`를 사용합니다.

## 로컬 설정 (Git에 커밋 금지)

`local.properties`는 `.gitignore`에 포함됩니다. Android SDK 경로와 선택적 초기값/서명값을 넣습니다. 실제 전화번호와 비밀값을 소스나 공유 로그에 넣지 마세요.

```properties
sdk.dir=C\:\\Users\\YOUR_NAME\\AppData\\Local\\Android\\Sdk
relay.serverPhone=010-XXXX-XXXX
relay.serverUrl=https://your-domain.example

# 선택: release signing
relay.signing.storeFile=keystore/release.jks
relay.signing.storePassword=LOCAL_ONLY
relay.signing.keyAlias=release
relay.signing.keyPassword=LOCAL_ONLY
```

전화번호는 앱 wizard에서도 입력할 수 있고 webhook payload에는 포함되지 않습니다. 소스 기본값은 비어 있습니다. 기기 ID 기본값은 `kb-server-phone-01`, 기기 이름 기본값은 `KB 입금 서버폰`입니다.

Device Secret은 `local.properties`에 넣지 않습니다. 앱 wizard에서 입력하면 Android Keystore가 관리하는 AES-256/GCM 키로 암호화되어 백업 불가 앱 저장소에 보관됩니다. 서버 등록값과 정확히 같아야 합니다.

## 빌드, 서명, 설치

```text
gradlew.bat :app:testDebugUnitTest
gradlew.bat :app:assembleDebug
adb install -r app\build\outputs\apk\debug\app-debug.apk
```

release keystore 값을 위 로컬 설정에 모두 입력한 경우:

```text
gradlew.bat :app:assembleRelease
adb install -r app\build\outputs\apk\release\app-release.apk
```

서명값을 설정하지 않은 release APK는 배포 설치용으로 사용할 수 없습니다. Android Studio의 Generate Signed App 또는 조직의 안전한 CI signing을 사용해도 됩니다. keystore와 비밀번호는 커밋하지 마세요.

## 최초 설정 5단계

1. 개인정보 경계를 확인합니다. 파싱된 필드만 Room에 저장됩니다.
2. 기기 ID/이름, 로컬 전용 서버폰 번호, 서버 URL을 입력합니다.
3. 서버에 등록된 Device Secret을 입력합니다.
4. 기본 SMS 앱, 설치된 Samsung Messages(`com.samsung.android.messaging`), Google Messages(`com.google.android.apps.messaging`) 중 실제 알림 발신 package를 선택하거나 직접 덮어씁니다.
5. Samsung 배터리 제한을 해제하고 설정을 저장합니다.

알림 접근 버튼으로 Android의 **알림 접근 허용** 화면을 열어 `KB 입금 알림 릴레이`를 허용하세요. 앱은 메시지 앱 package가 선택값과 일치하는지 확인하기 전에는 알림 extras를 읽지 않습니다.

## Samsung 배터리 설정

기종/One UI 버전에 따라 메뉴명이 다를 수 있습니다.

- 설정 → 애플리케이션 → KB Deposit Relay → 배터리 → **제한 없음**
- 설정 → 배터리 및 디바이스 케어 → 배터리 → 백그라운드 사용 제한
  - 절전 상태 앱/초절전 상태 앱에서 제거
  - 절전 예외 앱에 추가
- 자동 최적화 또는 미사용 앱 권한 제거 대상에서 제외

앱의 배터리 버튼은 시스템 최적화 목록을 열 뿐, SMS나 접근성 권한을 요청하지 않습니다.

## 서버와 보안 규약

- release: HTTPS URL만 허용
- debug: HTTPS 또는 `localhost`, `127.0.0.1`, Android emulator의 `10.0.2.2`에 한해 HTTP 허용
- 입금 endpoint: `/api/internal/bank-relay/deposits`
- heartbeat endpoint: `/api/internal/bank-relay/heartbeat`
- HMAC-SHA256 입력: `timestamp + "." + nonce + "." + exactRawJsonBody`
- 헤더: `X-Relay-Device`, `X-Relay-Timestamp`, `X-Relay-Nonce`, `X-Relay-Signature`

입금 payload에는 event/device ID, event hash, 은행, 계좌 마스크, 입금자명, 금액, 거래시각, 테스트 여부만 들어갑니다. 전화번호와 원문은 포함되지 않습니다.

## 테스트와 큐 동작

대시보드의 **서버 테스트**는 즉시 heartbeat를 보내 URL/HMAC 인증을 확인합니다. **KB 파서 테스트**는 문서의 고정 KB 샘플을 파싱해 `isTest=true` 이벤트를 실제 전송 큐에 추가합니다. 서버는 이 이벤트를 기록만 하고 주문 결제를 절대 변경하지 않아야 합니다. 같은 샘플은 동일 hash로 중복 삽입되지 않습니다.

Room의 `eventHash`는 UNIQUE입니다. 상태는 `PENDING → SENDING → SENT`이며:

- 네트워크 오류/서버 5xx: 이벤트를 `PENDING`으로 돌리고 WorkManager 지수 backoff로 재시도
- HTTP 401: 해당 이벤트를 영구 `FAILED`
- 기타 4xx: 재시도로 해결되지 않는 요청으로 `FAILED`
- 앱 중단 후 오래 남은 `SENDING`: 다음 worker 시작 시 `PENDING`으로 복구
- 연결된 네트워크에서만 고유 one-time sync 실행
- 15분마다 heartbeat, 앱 시작/부팅 직후 즉시 heartbeat/sync 실행

실패 이벤트에는 원문이나 서버 응답 body가 아닌 일반화된 상태만 저장됩니다.

로컬 JVM/기기 테스트:

```text
gradlew.bat :app:testDebugUnitTest
gradlew.bat :app:connectedDebugAndroidTest
gradlew.bat :app:lintDebug
gradlew.bat :app:assembleDebug
```

JVM 테스트는 입금 파싱, 출금/OTP/기타 알림 거부, 연말 연도 추론, SHA-256/HMAC, repository 중복/스케줄링을 검사합니다. instrumented Room 테스트는 UNIQUE hash와 stale `SENDING` 복구를 검사합니다.

## 재부팅 점검

1. 대시보드에서 알림 접근/서버/배터리가 정상인지 확인합니다.
2. 기기를 재부팅하고 잠금을 해제합니다.
3. 앱을 열어 알림 접근이 유지됐는지 확인합니다.
4. 서버 관리자 화면에서 부팅 직후 heartbeat가 들어왔는지 확인합니다.
5. 비행기 모드에서 parser test를 추가한 뒤 네트워크 복구 시 `SENT`로 바뀌는지 확인합니다.

## 실제 1,000원 검증 체크리스트

아래 항목은 에뮬레이터나 자동 테스트로 증명할 수 없으며 반드시 운영 승인된 물리 기기와 실제 은행 알림으로 수동 확인해야 합니다.

- [ ] 운영 서버에 기기 ID와 동일한 Secret이 안전하게 등록됨
- [ ] 운영 HTTPS 인증서/URL과 기기 시각이 정상
- [ ] 실제 알림을 표시하는 메시지 앱 package 선택
- [ ] 알림 접근 허용 및 Samsung 배터리 제한 해제
- [ ] 서버 테스트/heartbeat 정상
- [ ] parser test가 서버에서 `IGNORED(TEST_EVENT)`이며 주문을 결제하지 않음
- [ ] 정확한 입금자명/금액의 유효한 입금대기 주문을 준비
- [ ] 1,000원 실제 입금 후 단 하나의 이벤트와 단 하나의 결제 완료 확인
- [ ] 관리자 audit, 재고, 포인트, 배송준비 상태 확인
- [ ] 중복 알림/앱 재시작에도 중복 결제가 없는지 확인
- [ ] 1,000원 출금 알림은 이벤트가 생성되지 않는지 확인

물리 기기 동작, 실제 KB 알림 형식, 운영 서버 응답, release signing, 실송금은 수동 검증 전까지 **미검증**입니다.
