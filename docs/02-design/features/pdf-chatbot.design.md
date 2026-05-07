# pdf-chatbot 설계 문서

> **요약**: 라이트모드 채팅 UI + 단일 파일 구조(Option A)로 구현하는 노무 FAQ 챗봇 설계
>
> **프로젝트**: 노무 업무 어시스턴트 챗봇
> **버전**: 0.1
> **작성자**: cheon
> **날짜**: 2026-05-07
> **상태**: Draft
> **기획 문서**: [pdf-chatbot.plan.md](../01-plan/features/pdf-chatbot.plan.md)

---

## Context Anchor

> Plan 문서에서 복사. Design→Do 핸드오프 시 전략적 맥락 유지.

| Key | Value |
|-----|-------|
| **WHY** | 방대한 근로기준법 PDF를 누구나 쉽고 빠르게 검색·이해하기 위함 |
| **WHO** | 노무 담당자, 소규모 사업주, 노동법을 확인해야 하는 직원 |
| **RISK** | PDF 텍스트 길이가 OpenAI 컨텍스트 한계를 초과할 수 있음 |
| **SUCCESS** | 질문 후 응답 수신, 법 조항 기반 정확한 답변 제공 |
| **SCOPE** | Phase 1: 서버+PDF 로더+API, Phase 2: 채팅 UI, Phase 3: Vercel 배포 |

---

## 1. 개요

### 1.1 설계 목표

- 단일 파일 구조(Option A)로 최소한의 복잡도 유지
- 라이트모드 기반 깔끔한 채팅 UI (ppeanut.dothome.co.kr/demo/ 참고)
- `server.js` 1개 + `public/index.html` 1개로 전체 기능 완성
- 초보자가 코드 전체를 한눈에 파악할 수 있는 구조

### 1.2 설계 원칙

- **단순성**: 파일 수 최소화, 외부 CSS 프레임워크 없이 순수 CSS
- **보안 우선**: API 키는 절대 프론트엔드에 노출하지 않음
- **주석 충실**: 모든 함수와 핵심 로직에 한국어 주석 필수
- **초보자 배려**: 코드 흐름이 위→아래로 직관적으로 읽히도록 작성

---

## 2. 아키텍처

### 2.0 선택된 아키텍처

**Option A — 단일 파일 구조** 선택

| 기준 | 내용 |
|------|------|
| **접근 방식** | 최소 파일 수, 최대 단순성 |
| **생성 파일** | 2개 (server.js, public/index.html) |
| **복잡도** | 낮음 |
| **선택 이유** | 초보자 친화적, 전체 흐름 파악 용이, 빠른 개발 |

### 2.1 컴포넌트 다이어그램

```
┌─────────────────────────────────────────┐
│           사용자 브라우저               │
│  ┌──────────────────────────────────┐   │
│  │      public/index.html           │   │
│  │  ┌────────┐  ┌────────────────┐  │   │
│  │  │ 헤더   │  │  채팅 영역     │  │   │
│  │  │(타이틀)│  │ (말풍선 목록)  │  │   │
│  │  └────────┘  └────────────────┘  │   │
│  │  ┌──────────────────────────┐     │   │
│  │  │   입력창 + 전송 버튼     │     │   │
│  │  └──────────────────────────┘     │   │
│  └──────────────────────────────────┘   │
└───────────────────┬─────────────────────┘
                    │ POST /api/chat
                    │ { message, history: [...] }
                    ▼
┌─────────────────────────────────────────┐
│         server.js (Express)             │
│                                         │
│  [시작 시] docs/ → pdf-parse → pdfText  │
│                                         │
│  [요청] 시스템프롬프트 + history + msg  │
│       → OpenAI gpt-4o-mini API 호출    │
│       → { reply: "..." } 반환          │
└─────────────────────────────────────────┘
```

### 2.2 데이터 흐름

```
사용자 메시지 입력
  → JS: chatHistory 배열에 추가
  → fetch POST /api/chat { message, history }
  → server.js: pdfText + history + message → OpenAI API
  → OpenAI: 응답 텍스트 생성
  → server.js: { reply: "답변 텍스트" } 반환
  → JS: chatHistory에 AI 답변 추가
  → DOM: 말풍선으로 화면에 표시
```

### 2.3 의존성

| 컴포넌트 | 의존 대상 | 목적 |
|----------|----------|------|
| `server.js` | `express` | HTTP 서버 및 라우팅 |
| `server.js` | `openai` | OpenAI gpt-4o-mini API 호출 |
| `server.js` | `pdf-parse` | PDF 텍스트 추출 |
| `server.js` | `dotenv` | `.env`에서 API 키 로드 |
| `public/index.html` | 없음 | 순수 바닐라 HTML/CSS/JS |

---

## 3. 데이터 모델

### 3.1 서버 메모리 (pdfText)

```javascript
// 서버 시작 시 1회만 로드, 이후 모든 요청에서 재사용
let pdfText = "";  // docs/ 폴더의 PDF에서 추출한 전체 텍스트
```

### 3.2 API 요청/응답 형식

```javascript
// 요청 (클라이언트 → 서버)
{
  "message": "연차는 며칠인가요?",    // 사용자가 입력한 메시지
  "history": [                         // 이전 대화 기록 배열
    { "role": "user",      "content": "퇴직금은 어떻게 계산하나요?" },
    { "role": "assistant", "content": "근로기준법 제34조에 따르면..." }
  ]
}

// 응답 (서버 → 클라이언트)
{
  "reply": "근로기준법 제60조에 따르면 1년 이상 계속 근로한..."
}

// 에러 응답
{
  "error": "PDF 파일을 찾을 수 없습니다."
}
```

### 3.3 클라이언트 대화 기록 (chatHistory)

```javascript
// 브라우저 메모리에만 존재 (새로고침 시 초기화)
// OpenAI messages 배열 형식과 동일하게 유지
let chatHistory = [
  // { role: "user" | "assistant", content: "..." }
];
```

---

## 4. API 명세

### 4.1 엔드포인트 목록

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| GET | `/` | `public/index.html` 제공 (정적 파일) | 없음 |
| GET | `/style.css` | 없음 (CSS는 index.html 인라인) | — |
| POST | `/api/chat` | AI 답변 요청 | 없음 (서버 키 사용) |

### 4.2 `POST /api/chat` 상세

**요청 헤더:**
```
Content-Type: application/json
```

**요청 본문:**
```json
{
  "message": "string (필수) — 사용자 질문",
  "history": "array (선택) — 이전 대화 [{role, content}]"
}
```

**응답 200 OK:**
```json
{ "reply": "AI 답변 텍스트" }
```

**응답 400 Bad Request:**
```json
{ "error": "message가 비어 있습니다." }
```

**응답 500 Internal Server Error:**
```json
{ "error": "OpenAI API 호출 중 오류가 발생했습니다." }
```

---

## 5. UI/UX 설계

### 5.1 디자인 컨셉 (참고: ppeanut.dothome.co.kr/demo/)

라이트모드, 깔끔한 전문가 스타일 AI 채팅 인터페이스.  
불필요한 장식 없이 가독성과 사용성에 집중.

### 5.2 디자인 토큰 (색상/폰트/간격)

```css
/* 색상 팔레트 — 라이트모드 */
--color-bg-page:    #f0f2f5;   /* 페이지 배경: 연한 회색 */
--color-bg-chat:    #ffffff;   /* 채팅창 배경: 흰색 */
--color-header-bg:  #ffffff;   /* 헤더 배경: 흰색 */
--color-header-border: #e5e7eb; /* 헤더 하단 구분선 */

--color-primary:    #2563eb;   /* 주색 (파란색): 사용자 말풍선, 버튼 */
--color-primary-hover: #1d4ed8; /* 버튼 hover */

--color-bubble-user: #2563eb;  /* 사용자 말풍선 배경 */
--color-bubble-user-text: #ffffff; /* 사용자 말풍선 글자 */
--color-bubble-ai:   #f3f4f6;  /* AI 말풍선 배경: 연한 회색 */
--color-bubble-ai-text: #1f2937; /* AI 말풍선 글자: 진한 회색 */

--color-input-bg:   #ffffff;   /* 입력창 배경 */
--color-input-border: #d1d5db; /* 입력창 테두리 */
--color-input-focus: #2563eb;  /* 입력창 포커스 테두리 */

--color-text-primary:   #1f2937; /* 기본 텍스트 */
--color-text-secondary: #6b7280; /* 보조 텍스트 (시간 등) */
--color-text-header:    #111827; /* 헤더 타이틀 */

/* 폰트 */
--font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI',
               'Pretendard', sans-serif;
--font-size-base:  15px;
--font-size-small: 13px;
--font-size-title: 18px;
--font-weight-bold: 600;

/* 간격 */
--spacing-xs:  4px;
--spacing-sm:  8px;
--spacing-md:  16px;
--spacing-lg:  24px;

/* 둥근 모서리 */
--radius-bubble: 18px;          /* 말풍선 */
--radius-input:  12px;          /* 입력창 */
--radius-button: 50%;           /* 전송 버튼 (원형) */

/* 그림자 */
--shadow-chat: 0 2px 12px rgba(0,0,0,0.08); /* 채팅창 */
--shadow-header: 0 1px 4px rgba(0,0,0,0.06); /* 헤더 */
```

### 5.3 화면 레이아웃

```
┌──────────────────────────────────────┐  ← 전체 화면 (100vh)
│  [헤더]                              │  ← 높이: 64px, 흰색, 하단 그림자
│  🤖 노무 업무 어시스턴트            │     좌: 아이콘+타이틀 / 우: 상태 표시
├──────────────────────────────────────┤
│                                      │
│  [채팅 영역] flex-grow: 1            │  ← overflow-y: auto, 스크롤
│  ┌─────────────────────────────┐     │
│  │ 🤖 AI 말풍선 (왼쪽 정렬)   │     │
│  │ ─────────────────────────── │     │
│  │          사용자 말풍선 (우) │     │
│  └─────────────────────────────┘     │
│                                      │
├──────────────────────────────────────┤
│  [입력 영역]                          │  ← 높이: 80px, 흰색, 상단 구분선
│  ┌──────────────────────┐  [▶]      │
│  │  메시지를 입력하세요...│          │
│  └──────────────────────┘            │
└──────────────────────────────────────┘
```

### 5.4 말풍선 스타일

```
AI 말풍선 (왼쪽 정렬):
┌───────────────────────────────────────┐
│ 🤖  [AI 아이콘 + 이름]               │
│     ┌─────────────────────────────┐   │
│     │ 답변 텍스트 (최대 70% 너비) │   │  ← 배경: #f3f4f6, 글자: #1f2937
│     └─────────────────────────────┘   │     radius: 4px 18px 18px 18px
└───────────────────────────────────────┘

사용자 말풍선 (오른쪽 정렬):
┌───────────────────────────────────────┐
│                  [사용자 이름] 👤     │
│   ┌─────────────────────────────┐     │
│   │ 질문 텍스트 (최대 70% 너비) │     │  ← 배경: #2563eb, 글자: #ffffff
│   └─────────────────────────────┘     │     radius: 18px 4px 18px 18px
└───────────────────────────────────────┘
```

### 5.5 로딩 인디케이터 (AI 생각 중)

```
🤖
  ┌──────────────────┐
  │ ● ● ●  (점 3개 애니메이션) │  ← 배경: #f3f4f6, CSS 애니메이션
  └──────────────────┘
```

### 5.6 초기 환영 메시지

```
채팅 시작 시 자동으로 AI 말풍선으로 표시:
"안녕하세요! 노무 업무 어시스턴트입니다.
 근로기준법 관련 궁금한 점을 질문해 주세요.

 예시 질문:
 • 연차 유급휴가는 며칠인가요?
 • 퇴직금 계산 방법이 궁금해요.
 • 해고 예고 기간은 얼마나 되나요?"
```

### 5.7 Page UI 체크리스트 (Gap Detector 검증 기준)

#### 메인 채팅 페이지 (index.html)

**헤더 영역:**
- [ ] 헤더: 흰색 배경, 하단 그림자, 높이 64px
- [ ] 타이틀 텍스트: "노무 업무 어시스턴트" (아이콘 포함)
- [ ] 헤더 높이: 고정 (스크롤 시 유지)

**채팅 영역:**
- [ ] 채팅 컨테이너: 헤더~입력창 사이 전체 차지, 스크롤 가능
- [ ] AI 말풍선: 왼쪽 정렬, 연한 회색 배경(#f3f4f6), 아이콘 포함
- [ ] 사용자 말풍선: 오른쪽 정렬, 파란 배경(#2563eb), 흰 글자
- [ ] 말풍선 최대 너비: 70% (좁은 화면도 대응)
- [ ] 초기 환영 메시지: AI 말풍선으로 자동 표시
- [ ] 로딩 인디케이터: 점 3개 애니메이션 (AI 응답 대기 중)

**입력 영역:**
- [ ] 입력창(textarea): placeholder "메시지를 입력하세요...", 엔터키 전송 가능
- [ ] 전송 버튼: 파란 원형 버튼, 화살표 아이콘
- [ ] 입력창 포커스 시 파란 테두리 표시
- [ ] 전송 중 입력창·버튼 비활성화 (중복 전송 방지)

**반응형:**
- [ ] 모바일(375px)에서 레이아웃 깨지지 않음
- [ ] 말풍선 최대 너비 70% 유지

---

## 6. 에러 처리

### 6.1 에러 코드 정의

| 상황 | 처리 방식 | 사용자 노출 메시지 |
|------|-----------|-------------------|
| PDF 파일 없음 | 서버 시작 시 경고 출력, 서버는 계속 실행 | "PDF 파일을 찾지 못했습니다. docs/ 폴더를 확인해 주세요." |
| message 빈 값 | 400 응답 | "메시지를 입력해 주세요." |
| OpenAI API 오류 | 500 응답 | "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." |
| 네트워크 오류 | fetch catch | "서버와 연결할 수 없습니다." |

### 6.2 에러 응답 형식

```json
{ "error": "에러 메시지 텍스트" }
```

클라이언트는 응답에 `error` 필드가 있으면 AI 말풍선 대신 에러 스타일 말풍선으로 표시.

---

## 7. 보안 고려사항

- [x] `OPENAI_API_KEY`는 `server.js`에서만 `process.env.OPENAI_API_KEY`로 참조
- [x] `.env` 파일은 `.gitignore`에 포함 (절대 Git 커밋 금지)
- [x] 프론트엔드(index.html)에 API 키 관련 코드 없음
- [x] 사용자 입력을 OpenAI에 그대로 전달 (XSS는 DOM 조작으로 방어 — innerHTML 사용 금지)
- [x] CORS 설정: Vercel 환경에서는 동일 도메인이므로 별도 설정 불필요
- [ ] Rate Limiting: MVP에서는 생략, 추후 추가 가능

---

## 8. 테스트 계획

### 8.1 테스트 범위

| 유형 | 대상 | 방법 | 단계 |
|------|------|------|------|
| L1: API 테스트 | `/api/chat` 엔드포인트 | curl / 브라우저 | Do |
| L2: UI 동작 | 말풍선 표시, 버튼 동작 | 수동 브라우저 테스트 | Do |
| L3: E2E | 전체 대화 흐름 | 수동 시나리오 | Do |

### 8.2 L1: API 테스트 시나리오

| # | 엔드포인트 | 메서드 | 테스트 내용 | 기대 결과 |
|---|-----------|--------|------------|-----------|
| 1 | `/api/chat` | POST | 정상 질문 전송 | 200, `{ reply: "..." }` |
| 2 | `/api/chat` | POST | `message` 빈 문자열 | 400, `{ error: "..." }` |
| 3 | `/api/chat` | POST | `history` 포함 전송 | 200, 이전 대화 참조한 답변 |
| 4 | `/` | GET | 페이지 접근 | 200, HTML 반환 |

**L1 curl 예시:**
```bash
# 정상 요청 테스트
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "연차는 며칠인가요?", "history": []}'

# 빈 메시지 테스트
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": ""}'
```

### 8.3 L2: UI 동작 테스트 시나리오

| # | 페이지 | 동작 | 기대 결과 |
|---|--------|------|-----------|
| 1 | 메인 | 페이지 로드 | 환영 AI 말풍선 표시 |
| 2 | 메인 | 질문 입력 후 전송 | 로딩 표시 → AI 말풍선 추가 |
| 3 | 메인 | 엔터키 전송 | 전송 버튼과 동일하게 동작 |
| 4 | 메인 | 빈 입력창 전송 | 아무 반응 없음 (빈 전송 방지) |
| 5 | 메인 | 전송 중 버튼 상태 | 버튼/입력창 비활성화 |
| 6 | 메인 | 긴 대화 | 채팅창 자동 스크롤 (항상 최신 메시지 보임) |

### 8.4 L3: E2E 시나리오

| # | 시나리오 | 단계 | 성공 기준 |
|---|---------|------|-----------|
| 1 | 기본 대화 | 질문 → 답변 → 후속 질문 → 답변 | 이전 대화 참조한 맥락 있는 답변 |
| 2 | API 키 보안 | 브라우저 개발자 도구 소스 탭 확인 | `OPENAI_API_KEY` 없음 |
| 3 | PDF 기반 답변 | "연차는 며칠?" 질문 | "제60조" 등 조항 번호 포함 |

---

## 9. 클린 아키텍처 (Option A 단일 파일 기준)

단일 파일 구조이므로 레이어 분리 대신 **섹션 분리**로 관리:

### 9.1 server.js 내부 섹션 구조

```javascript
// ① 패키지 import 및 환경 변수 로드
// ② PDF 로드 함수 정의
// ③ 서버 시작 시 PDF 로드 실행
// ④ Express 미들웨어 설정 (정적 파일, JSON 파서)
// ⑤ POST /api/chat 라우트 핸들러
// ⑥ 서버 시작 (포트 listen)
```

### 9.2 public/index.html 내부 섹션 구조

```html
<!-- ① DOCTYPE, meta, title -->
<!-- ② <style> — 전체 CSS (디자인 토큰 → 컴포넌트 순) -->
<!-- ③ <body> — 헤더, 채팅 영역, 입력 영역 HTML -->
<!-- ④ <script> — 상태 변수, 함수, 이벤트 리스너 순 -->
```

### 9.3 파일별 책임 범위

| 파일 | 책임 |
|------|------|
| `server.js` | PDF 로드, OpenAI API 호출, 정적 파일 제공 |
| `public/index.html` | UI 렌더링, 사용자 인터랙션, API 통신 |
| `.env` | 환경 변수 (API 키) 보관 |
| `vercel.json` | Vercel 배포 라우팅 설정 |

---

## 10. 코딩 컨벤션

### 10.1 네이밍 규칙

| 대상 | 규칙 | 예시 |
|------|------|------|
| 변수/함수 | camelCase | `chatHistory`, `sendMessage()` |
| 상수 | UPPER_SNAKE_CASE | `MAX_HISTORY_LENGTH` |
| HTML id | kebab-case | `chat-messages`, `send-button` |
| CSS class | kebab-case | `.chat-bubble`, `.user-bubble` |

### 10.2 환경 변수 규칙

| 변수명 | 범위 | 접근 방법 |
|--------|------|-----------|
| `OPENAI_API_KEY` | 서버 전용 | `process.env.OPENAI_API_KEY` |
| `PORT` | 서버 전용 | `process.env.PORT \|\| 3000` |

### 10.3 이 기능의 컨벤션 적용

| 항목 | 적용 방식 |
|------|-----------|
| 주석 언어 | 한국어 필수 (CLAUDE.md 규칙) |
| 함수 주석 | 역할, 파라미터, 반환값 설명 |
| 보안 주석 | API 키 관련 코드에 경고 주석 |
| innerHTML 사용 | 금지 (XSS 방지) → textContent 또는 createElement 사용 |

---

## 11. 구현 가이드

### 11.1 파일 구조

```
my-pdf-chatbot/
├── server.js              ← 서버 진입점 (PDF 로더 + API 엔드포인트)
├── public/
│   └── index.html         ← 채팅 UI (HTML + 인라인 CSS + 인라인 JS)
├── docs/
│   └── 근로기준법(...).pdf  ← PDF 파일 (docs/ 폴더에만 보관)
├── .env                   ← API 키 (Git 절대 제외!)
├── .gitignore             ← .env, node_modules/ 포함
├── package.json           ← 의존성 정의
└── vercel.json            ← Vercel 배포 설정
```

### 11.2 구현 순서

1. [ ] **환경 준비** — package.json 생성, npm install, .env 작성, PDF 이동
2. [ ] **server.js** — PDF 로더 → Express 설정 → `/api/chat` 라우트 → 포트 리슨
3. [ ] **public/index.html** — HTML 구조 → CSS 스타일 → JS 로직
4. [ ] **로컬 테스트** — `node server.js` → 브라우저 확인 → curl 테스트
5. [ ] **vercel.json** — 배포 설정 작성
6. [ ] **Vercel 배포** — 환경 변수 등록 → 배포

### 11.3 Session Guide

> 단일 파일 구조(Option A)이므로 1-2세션으로 전체 구현 가능

#### Module Map

| 모듈 | Scope Key | 설명 | 예상 소요 |
|------|-----------|------|:---------:|
| 서버 (server.js) | `module-1` | PDF 로더 + Express API | 20-30턴 |
| UI (index.html) | `module-2` | 채팅 UI + JS 로직 | 30-40턴 |
| 배포 설정 | `module-3` | vercel.json + 배포 | 10-15턴 |

#### 권장 세션 계획

| 세션 | 단계 | Scope | 예상 소요 |
|------|------|-------|:---------:|
| Session 1 | Plan + Design | 전체 | 30-35턴 |
| Session 2 | Do | `--scope module-1` (server.js) | 30-40턴 |
| Session 3 | Do | `--scope module-2` (index.html) | 35-45턴 |
| Session 4 | Do + Check | `--scope module-3` + 테스트 | 20-30턴 |

---

## 버전 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|-----------|--------|
| 0.1 | 2026-05-07 | 초안 작성 — Option A 선택, 라이트모드 UI 설계 | cheon |
