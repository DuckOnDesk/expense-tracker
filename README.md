# 가계부 (Expense Tracker)

알림을 받아 자동으로 기록하고, AI로 카테고리를 분류하는 가계부 웹앱입니다.
지금은 1단계(기본 가계부 기능)까지 구현되어 있습니다:

- Supabase Auth 기반 로그인/회원가입
- 거래 내역 수동 등록/수정/삭제
- 기간/카테고리/가맹점/금액 필터 및 검색
- 카테고리별 지출 비중, 최근 6개월 추이 대시보드
- 가맹점-카테고리 학습 매핑 테이블 (추후 알림 자동분류에 사용)

다음 단계(안드로이드 알림 캡처, AI 자동분류 폴백)는 README 하단의 로드맵을 참고하세요.

## 시작하기

### 1. Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com)에서 새 프로젝트를 만듭니다.
2. 프로젝트의 SQL Editor에서 `supabase/migrations/0001_init.sql` 내용을 실행해 테이블/RLS 정책을 생성합니다.
3. 프로젝트 설정(Project Settings → API)에서 `Project URL`과 `anon public key`를 확인합니다.
4. Authentication → Providers에서 Email 로그인이 활성화되어 있는지 확인합니다. (이메일 인증 확인 메일을 끄고 싶다면 Authentication → Settings에서 "Confirm email"을 비활성화하세요.)

### 2. 환경 변수 설정

```bash
cp .env.local.example .env.local
```

`.env.local`을 열어 Supabase 프로젝트 정보로 채웁니다.

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
```

### 3. 의존성 설치 및 개발 서버 실행

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) 접속 후 회원가입하면 기본 카테고리가 자동 생성됩니다.

모바일에서 같은 와이파이로 접속하려면 `npm run dev -- -H 0.0.0.0` 으로 실행 후 `http://<PC의 사설IP>:3000`으로 접속하세요.

## 폴더 구조

```
src/
  app/
    login/            로그인/회원가입 페이지 + 서버 액션
    transactions/      거래 내역 페이지 + CRUD 서버 액션
    page.tsx            대시보드 (홈)
  components/          재사용 UI 컴포넌트 (필터, 차트, 폼 등)
  lib/
    supabase/            Supabase client/server/middleware 헬퍼
    merchantMapping.ts    가맹점→카테고리 학습 로직
    seedCategories.ts     신규 유저 기본 카테고리 생성
  types/db.ts             공용 타입 정의
supabase/migrations/      DB 스키마 SQL
```

## 배포 (Vercel)

1. GitHub 저장소를 Vercel에 연결합니다.
2. Vercel 프로젝트 환경 변수에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`를 등록합니다.
3. 배포 후 모바일/PC 어디서든 같은 URL로 접속해 사용할 수 있습니다.

## 로드맵 (다음 단계)

- [ ] 안드로이드 알림 캡처 앱 (`NotificationListenerService`) + webhook 수신 API
- [ ] 카드사별 알림 텍스트 정규식 파싱
- [ ] 신규 가맹점에 한해 AI(예: Claude Haiku)로 카테고리 자동 추정 → 매핑 테이블에 캐싱
- [ ] 예산 설정 및 초과 알림
- [ ] Play Store 배포 대비: 개인정보처리방침 작성, 알림 접근 권한 소명 자료 준비
