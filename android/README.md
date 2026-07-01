# 가계부 알림 — Android 앱

카드/은행 알림을 캡처해 가계부 서버(Next.js webhook)로 전송하는 안드로이드 앱입니다.

## 구조

```
CardNotificationListener  — 모든 알림 수신, 카드사 패키지 필터링
WebhookSender             — HTTPS POST 전송 (최대 3회 재시도)
SettingsActivity          — 앱 최초 설정 화면 (URL/Secret/UserId 입력 + 권한 부여)
```

## 빌드 방법

1. Android Studio에서 `android/` 폴더를 프로젝트로 열기
2. `android/local.properties`에 SDK 경로 확인 (`sdk.dir=/path/to/android-sdk`)
3. Gradle Sync → Build → Build APK(debug)
4. 기기에 APK 설치 (사이드로드, 서명 불필요)

## 최초 설정

앱 설치 후:
1. 앱 실행 → 설정 화면에서 아래 3가지 입력
   - **Webhook URL**: `https://your-app.vercel.app` (끝 슬래시 불필요)
   - **Webhook Secret**: `.env.local`의 `WEBHOOK_SECRET` 값
   - **User ID**: Supabase 대시보드 → Authentication → Users 에서 내 UUID 복사
2. "알림 접근 권한 부여" 버튼 → 시스템 설정에서 "가계부 알림" 허용
3. 이후 카드/은행 알림이 오면 자동으로 가계부에 기록됩니다

## 서버 환경 변수 추가

`.env.local` 또는 Vercel 환경 변수에 아래 두 가지를 추가해야 합니다:

```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # Supabase Settings > API > service_role
WEBHOOK_SECRET=your-random-secret                  # 직접 생성 (예: openssl rand -hex 32)
ANTHROPIC_API_KEY=your-api-key                     # AI 폴백 분류용 (없으면 미분류 처리)
```

## 지원 카드/은행

- 신한카드 / 신한은행
- 삼성카드 / 삼성페이
- KB국민카드 / KB국민은행
- 현대카드
- 롯데카드
- 우리카드 / 우리은행
- NH농협카드 / NH농협은행
- 하나카드
- 카카오페이
- 네이버페이
- 토스

알림 포맷이 다른 카드사나 새 포맷은 `src/lib/notificationParser.ts`의 PATTERNS 배열에 추가하면 됩니다.
