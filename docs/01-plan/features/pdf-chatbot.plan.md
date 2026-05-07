# pdf-chatbot 기획 문서

> **요약**: 근로기준법 등 노무 관련 PDF를 읽고 사용자 질문에 자연어로 답변하는 챗봇
>
> **프로젝트**: 노무 업무 어시스턴트 챗봇
> **버전**: 0.2
> **작성자**: cheon
> **날짜**: 2026-05-07
> **상태**: Draft (CLAUDE.md 기준 재작성)

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem (문제)** | 근로기준법 PDF는 분량이 방대해 특정 조항을 찾거나 이해하는 데 시간이 오래 걸림 |
| **Solution (해결책)** | PDF를 서버에서 읽어 OpenAI gpt-4o-mini에 컨텍스트로 제공, 자연어로 즉시 답변 |
| **Function/UX Effect** | 복잡한 법률 문서를 채팅 형태로 빠르게 검색·이해 가능 |
| **Core Value** | 노무 담당자가 법 조항을 직접 찾는 시간을 단축하여 업무 효율 향상 |

---

## Context Anchor

> Plan 문서에서 자동 추출. Design/Do 문서에 복사하여 컨텍스트 연속성 보장.

| Key | Value |
|-----|-------|
| **WHY** | 방대한 근로기준법 PDF를 누구나 쉽고 빠르게 검색·이해하기 위함 |
| **WHO** | 노무 담당자, 소규모 사업주, 노동법을 확인해야 하는 직원 |
| **RISK** | PDF 텍스트 길이가 OpenAI 컨텍스트 한계를 초과할 수 있음 |
| **SUCCESS** | 질문 후 응답 수신, 법 조항 기반 정확한 답변 제공 |
| **SCOPE** | Phase 1: 서버+PDF 로더+API 엔드포인트, Phase 2: 채팅 UI, Phase 3: Vercel 배포 |

---

## 1. 개요

### 1.1 목적

`docs/` 폴더에 있는 PDF(근로기준법 등)를 서버 시작 시 한 번만 읽어 메모리에 올려두고,
사용자가 채팅 UI에서 질문하면 OpenAI gpt-4o-mini 모델이 PDF 내용을 바탕으로 답변한다.

### 1.2 배경

- 근로기준법은 조항이 많고 법률 용어가 어려워 일반인이 직접 찾기 어려움
- 노무사나 법률 전문가 없이도 기본적인 노동법 질문에 즉시 답변받고 싶은 수요 존재
- OpenAI gpt-4o-mini는 비용 대비 성능이 뛰어나 소규모 프로젝트에 적합

### 1.3 관련 문서

- CLAUDE.md: 프로젝트 전체 규칙 및 아키텍처 가이드
- PRD: `docs/00-pm/pdf-chatbot.prd.md` (참고용, API 모델은 본 Plan 기준)
- PDF 파일: `docs/` 폴더 내 보관

---

## 2. 범위 (Scope)

### 2.1 포함 (In Scope)

- [x] `docs/` 폴더의 PDF를 서버 시작 시 1회 읽어 텍스트로 변환 후 메모리 저장
- [x] `POST /api/chat` 엔드포인트: 사용자 메시지 수신 → OpenAI API 호출 → 응답 반환
- [x] 대화 기록(chat history) 유지하여 매 요청 시 이전 대화 포함
- [x] 바닐라 HTML/CSS/JS로 작성한 채팅 UI (`public/index.html`)
- [x] `.env` 파일로 API 키 관리 (Git에 절대 포함하지 않음)
- [x] Vercel 배포 설정 (`vercel.json`)
- [x] 모든 코드에 한국어 주석 작성

### 2.2 제외 (Out of Scope)

- 사용자 로그인/회원가입 (인증 없음)
- 데이터베이스 저장 (대화 이력은 브라우저 메모리에만 유지)
- 여러 PDF 동시 지원 (단일 PDF 또는 docs/ 내 전체 PDF)
- 관리자 페이지, 통계 대시보드
- 실시간 스트리밍 (단일 응답 방식 — 구현 단순화)

---

## 3. 요구사항

### 3.1 기능 요구사항 (Functional Requirements)

| ID | 요구사항 | 우선순위 | 상태 |
|----|----------|----------|------|
| FR-01 | 서버 시작 시 `docs/` 폴더의 PDF 파일을 자동으로 읽어 텍스트로 변환 | High | Pending |
| FR-02 | `POST /api/chat` 엔드포인트: `{ message }` 또는 `{ message, history }` 수신 | High | Pending |
| FR-03 | PDF 텍스트를 시스템 프롬프트에 삽입하여 PDF 기반 답변 유도 | High | Pending |
| FR-04 | OpenAI gpt-4o-mini 모델로 API 호출 후 응답 텍스트 반환 | High | Pending |
| FR-05 | 프론트엔드에서 채팅 UI 구현 (메시지 입력, 전송, 응답 표시) | High | Pending |
| FR-06 | 이전 대화 내용을 배열로 관리하여 매 요청 시 OpenAI에 함께 전송 | Medium | Pending |
| FR-07 | Vercel 배포를 위한 `vercel.json` 설정 | Medium | Pending |
| FR-08 | PDF 로드 실패 시 서버가 중단되지 않고 에러 메시지 반환 | Medium | Pending |

### 3.2 비기능 요구사항 (Non-Functional Requirements)

| 분류 | 기준 | 측정 방법 |
|------|------|-----------|
| **보안** | `OPENAI_API_KEY`를 프론트엔드에 절대 노출하지 않음 | 코드 리뷰 + 브라우저 소스 확인 |
| **보안** | `.env` 파일을 `.gitignore`에 포함하여 Git에서 제외 | Git 상태 확인 (`git status`) |
| **코드 품질** | 모든 함수에 역할을 설명하는 한국어 주석 | 코드 리뷰 |
| **안정성** | PDF 로드 실패 시 서버 유지, 적절한 에러 응답 | 수동 테스트 |
| **접근성** | 모바일 브라우저에서 기본 레이아웃 동작 | 반응형 테스트 |

---

## 4. 성공 기준 (Success Criteria)

### 4.1 완료 정의 (Definition of Done)

- [ ] `node server.js` 실행 시 콘솔에 "PDF 로드 완료" 출력
- [ ] 브라우저에서 노무 관련 질문 입력 후 답변 수신 확인
- [ ] 이전 대화를 참조하는 답변 동작 확인
- [ ] 브라우저 개발자 도구에서 `OPENAI_API_KEY` 노출 없음 확인
- [ ] Vercel 배포 후 공개 URL로 접근 가능

### 4.2 품질 기준 (Quality Criteria)

- [ ] 모든 함수에 한국어 주석 작성
- [ ] `.env`가 `.gitignore`에 포함되어 있음
- [ ] `server.js` 실행 시 오류 없이 시작됨
- [ ] `docs/` 폴더 외 경로에 PDF 없음

---

## 5. 리스크 및 대응 (Risks and Mitigation)

| 리스크 | 영향도 | 발생 가능성 | 대응 방안 |
|--------|--------|-------------|-----------|
| PDF 텍스트 길이가 OpenAI 컨텍스트 한계 초과 | High | Medium | 텍스트 추출 후 길이 측정, 초과 시 앞 100K자만 사용 |
| `pdf-parse` 라이브러리가 한글 PDF 파싱 실패 | High | Low | 서버 시작 시 추출 텍스트 일부를 콘솔에 출력하여 즉시 검증 |
| Vercel 서버리스에서 Express 앱 동작 불일치 | Medium | Medium | `vercel.json` 라우팅 설정 추가 + `vercel dev`로 로컬 테스트 |
| API 키 실수로 Git 커밋 | High | Low | `.gitignore` 설정 + 커밋 전 `git status` 확인 습관 |
| OpenAI API 과금 초과 | Medium | Low | gpt-4o-mini 저비용 모델 사용 + 사용량 모니터링 |

---

## 6. 영향 분석 (Impact Analysis)

### 6.1 변경 대상 리소스 (새로 생성)

| 리소스 | 유형 | 내용 |
|--------|------|------|
| `server.js` | 신규 파일 | Express 서버, PDF 로더, `/api/chat` 엔드포인트 |
| `public/index.html` | 신규 파일 | 채팅 UI (HTML + CSS + JS 인라인) |
| `package.json` | 신규 파일 | 의존성 관리 |
| `vercel.json` | 신규 파일 | Vercel 배포 라우팅 설정 |
| `.env` | 신규 파일 (Git 제외) | OPENAI_API_KEY 보관 |
| `.gitignore` | 기존 파일 수정 | `.env`, `node_modules/` 추가 확인 |
| `docs/` | 신규 폴더 | PDF 파일 보관 위치 |

### 6.2 기존 의존성

신규 프로젝트이므로 기존 코드에 대한 영향 없음.

### 6.3 검증 항목

- [ ] `.env` 파일이 `.gitignore`에 포함되어 Git에 올라가지 않음
- [ ] `public/index.html`에 API 키 관련 코드 없음
- [ ] PDF 파일이 `docs/` 폴더에만 존재

---

## 7. 아키텍처 고려사항 (Architecture Considerations)

### 7.1 프로젝트 레벨 선택

| 레벨 | 특징 | 선택 |
|------|------|:----:|
| **Starter** | 단순 구조, 정적 사이트 | ☐ |
| **Dynamic** | 백엔드 연동, 외부 API | ☑ |
| **Enterprise** | 마이크로서비스, 엄격한 레이어 분리 | ☐ |

> **Dynamic 레벨 선택** — Express 백엔드 + 바닐라 JS 프론트엔드 + OpenAI API 연동

### 7.2 주요 아키텍처 결정사항

| 결정 | 선택 | 이유 |
|------|------|------|
| 백엔드 | Express (Node.js) | CLAUDE.md 명시, 간단하고 Vercel 서버리스 연동 용이 |
| 프론트엔드 | 바닐라 HTML/CSS/JS | CLAUDE.md 명시, 의존성 없음 |
| AI 모델 | OpenAI gpt-4o-mini | CLAUDE.md 명시, 비용 대비 성능 우수 |
| PDF 파싱 | pdf-parse | Node.js 환경에서 가장 간단 |
| AI 응답 방식 | 단일 응답 (non-streaming) | 구현 단순화, 추후 스트리밍 전환 가능 |
| 대화 기록 | 클라이언트 배열 → 서버 전달 | 서버 상태 관리 불필요 |
| 배포 | Vercel | CLAUDE.md 명시, 무료 플랜 |

### 7.3 시스템 흐름도

```
[사용자 브라우저]
  public/index.html
  ├── 채팅 UI (메시지 입력 + 표시)
  └── POST /api/chat { message, history: [...] }
          │
          ▼
[Vercel 서버리스 / Express server.js]
  ├── [서버 시작 시 1회]
  │     docs/ 폴더 → pdf-parse → pdfText (메모리)
  │
  ├── [요청 처리]
  │     시스템 프롬프트 = "근로기준법 전문:\n" + pdfText
  │     messages = [시스템, ...history, 사용자 메시지]
  │     OpenAI API (gpt-4o-mini) 호출
  │
  └── 응답 텍스트 → JSON { reply: "..." } 반환

[환경 변수 - .env (Git 제외)]
  OPENAI_API_KEY=sk-...
  PORT=3000 (선택)
```

---

## 8. 컨벤션 및 환경 설정

### 8.1 기존 프로젝트 컨벤션 (CLAUDE.md 기준)

- [x] 모든 주석은 **한국어**로 작성
- [x] 함수마다 역할을 설명하는 한국어 주석 필수
- [x] 초보자가 헷갈릴 만한 로직에는 추가 설명 주석 작성
- [x] `.env` 파일은 **절대 수정하거나 Git에 추가하지 말 것**
- [x] `OPENAI_API_KEY`는 `server.js`에서만 `process.env.OPENAI_API_KEY`로 참조
- [x] PDF 파일은 반드시 `docs/` 폴더에 보관

### 8.2 환경 변수

| 변수명 | 용도 | 범위 | 비고 |
|--------|------|------|------|
| `OPENAI_API_KEY` | OpenAI API 인증 | 서버 전용 | `.env`에만 저장, Git 제외 필수 |
| `PORT` | 서버 포트 | 서버 전용 | 기본값 3000, 선택사항 |

### 8.3 필요한 패키지 (package.json)

```json
{
  "name": "my-pdf-chatbot",
  "version": "1.0.0",
  "description": "노무 업무 어시스턴트 챗봇",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "openai": "^4.0.0",
    "pdf-parse": "^1.1.1",
    "dotenv": "^16.0.0"
  }
}
```

### 8.4 .gitignore 필수 항목

```
.env
node_modules/
```

### 8.5 vercel.json 구조

```json
{
  "version": 2,
  "builds": [{ "src": "server.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "/server.js" }]
}
```

---

## 9. 구현 순서 (Next Steps)

다음 순서대로 구현한다:

1. [ ] **환경 준비**: `docs/` 폴더 생성 + PDF 파일 이동, `package.json` 생성, `npm install`
2. [ ] **`.env` 생성**: `OPENAI_API_KEY=실제키` 입력 (Git 제외 필수)
3. [ ] **`server.js` 작성**: PDF 로더 + Express 서버 + `/api/chat` 엔드포인트
4. [ ] **`public/index.html` 작성**: 채팅 UI + fetch API 연동
5. [ ] **로컬 테스트**: `node server.js` 실행 후 브라우저 확인
6. [ ] **`vercel.json` 작성**: 배포 라우팅 설정
7. [ ] **Vercel 배포**: `vercel` CLI 또는 GitHub 연동

> **다음 단계**: `/pdca design pdf-chatbot` — 설계 문서 작성

---

## 버전 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|-----------|--------|
| 0.1 | 2026-05-07 | 초안 작성 | cheon |
| 0.2 | 2026-05-07 | CLAUDE.md 기준 재작성 (OpenAI gpt-4o-mini, 스트리밍 제외, 단순화) | cheon |
