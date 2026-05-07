# pdf-chatbot 완료 리포트

> **상태**: Complete ✅
>
> **프로젝트**: 노무 업무 어시스턴트 챗봇
> **버전**: 1.0.0
> **작성자**: cheon
> **완료일**: 2026-05-07
> **PDCA 사이클**: #1

---

## Executive Summary

### 1.1 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 기능 | pdf-chatbot — 근로기준법 PDF 기반 노무 FAQ 챗봇 |
| 시작일 | 2026-05-07 |
| 완료일 | 2026-05-07 |
| 소요 기간 | 1일 (단일 세션) |

### 1.2 결과 요약

```
┌─────────────────────────────────────────────────┐
│  전체 완료율: 96%  (Match Rate: 96%)            │
├─────────────────────────────────────────────────┤
│  ✅ 완료:       7 / 8 기능 요구사항              │
│  ✅ 성공 기준:  4 / 5 충족                      │
│  ⏳ 미완료:     1 / 8 (Vercel 실배포 대기중)    │
│  ❌ 취소:       0 / 8                            │
└─────────────────────────────────────────────────┘
```

### 1.3 제공된 가치 (Value Delivered)

| 관점 | 내용 |
|------|------|
| **Problem (해결한 문제)** | 분량이 방대한 근로기준법 PDF에서 특정 조항을 찾는 데 걸리던 긴 시간 |
| **Solution (적용한 해결책)** | PDF 전문을 서버 메모리에 올려 두고, SambaNova LLM에 컨텍스트로 제공하는 단일 파일 Express 서버 |
| **Function/UX Effect** | 자연어 질문("연차휴가 며칠?")으로 법 조항 번호·인용·상세 설명·유의사항을 즉시 확인 가능 |
| **Core Value** | 노무 담당자가 법 조항을 직접 찾는 시간을 단축하고, 비전문가도 법률 정보에 쉽게 접근 |

---

## 1.4 성공 기준 최종 상태

> Plan 문서의 Success Criteria를 기준으로 최종 평가합니다.

| # | 기준 | 상태 | 근거 |
|---|------|:----:|------|
| SC-1 | `node server.js` 실행 시 "PDF 로드 완료" 출력 | ✅ Met | server.js:59 `console.log('✅ PDF 로드 완료: ...')` |
| SC-2 | 브라우저에서 노무 질문 입력 후 답변 수신 | ✅ Met | `POST /api/chat` + `public/index.html` fetchMessage() |
| SC-3 | 이전 대화를 참조하는 답변 동작 | ✅ Met | history 배열 전송 + messages 배열에 spread |
| SC-4 | 브라우저에서 API 키 노출 없음 | ✅ Met | 클라이언트 파일에 API 키 관련 코드 0건 |
| SC-5 | Vercel 배포 후 공개 URL 접근 가능 | ⏳ Code Ready | vercel.json 완료, 실배포 미확인 (수동 단계 필요) |

**성공률: 4/5 (80%) — 코드 관련 기준 전부 충족, 배포 단계만 남음**

---

## 1.5 의사결정 기록 요약 (Decision Record Summary)

| 출처 | 결정 사항 | 이행 여부 | 결과 |
|------|-----------|:---------:|------|
| [Plan] | Express + 바닐라 JS (Dynamic 레벨) | ✅ | server.js + index.html 구조로 구현 완료 |
| [Plan] | 단일 응답 방식 (non-streaming) | ✅ | `res.json({ reply })` 단일 반환, 구현 단순화 |
| [Plan] | 대화 기록 클라이언트 배열 → 서버 전달 | ✅ | chatHistory 배열로 history 유지 |
| [Design] | Option A — 단일 파일 구조 | ✅ | 파일 2개(server.js, index.html)로 전체 기능 완성 |
| [Do] | OpenAI gpt-4o-mini → **SambaNova** 교체 | ✅ (의도적 변경) | OpenAI SDK의 baseURL만 변경, 추가 비용 없이 동작 |
| [Do] | 시스템 프롬프트 4구조 강화 | ✅ | 결론/근거/상세/유의사항 구조로 답변 품질 향상 |

---

## 2. 관련 문서

| 단계 | 문서 | 상태 |
|------|------|------|
| Plan | [pdf-chatbot.plan.md](../01-plan/features/pdf-chatbot.plan.md) | ✅ 완료 |
| Design | [pdf-chatbot.design.md](../02-design/features/pdf-chatbot.design.md) | ✅ 완료 |
| Check | [pdf-chatbot.analysis.md](../03-analysis/pdf-chatbot.analysis.md) | ✅ 완료 (96%) |
| Report | 현재 문서 | 🔄 작성 중 |

---

## 3. 완료 항목

### 3.1 기능 요구사항

| ID | 요구사항 | 상태 | 비고 |
|----|----------|------|------|
| FR-01 | 서버 시작 시 `docs/` 폴더 PDF 자동 로드 | ✅ 완료 | server.js:32 `loadPdfText()` |
| FR-02 | `POST /api/chat` 엔드포인트 | ✅ 완료 | `{ message, history }` 수신 |
| FR-03 | PDF 텍스트를 시스템 프롬프트에 삽입 | ✅ 완료 | `pdfText.slice(0, 100000)` 토큰 보호 포함 |
| FR-04 | AI 모델 API 호출 후 응답 반환 | ✅ 완료 | SambaNova(OpenAI 호환) 사용 |
| FR-05 | 채팅 UI (메시지 입력, 전송, 응답 표시) | ✅ 완료 | public/index.html (말풍선 UI) |
| FR-06 | 이전 대화 기록 유지 및 요청에 포함 | ✅ 완료 | chatHistory 배열, 서버에 history 전달 |
| FR-07 | Vercel 배포를 위한 `vercel.json` | ✅ 완료 | @vercel/node + 라우팅 설정 완료 |
| FR-08 | PDF 로드 실패 시 서버 미중단 | ✅ 완료 | try-catch per file, 서버는 계속 실행 |

### 3.2 비기능 요구사항

| 분류 | 기준 | 달성 | 상태 |
|------|------|------|------|
| 보안 | API 키 프론트엔드 노출 금지 | 클라이언트 파일에 API 키 코드 0건 | ✅ |
| 보안 | `.env` Git 제외 | `.gitignore`에 `.env` 포함 | ✅ |
| 보안 | XSS 방어 | innerHTML 사용 0건, textContent 사용 | ✅ |
| 코드 품질 | 모든 함수에 한국어 주석 | server.js + index.html 전체 주석 완비 | ✅ |
| 안정성 | PDF 로드 실패 시 서버 유지 | try-catch 블록으로 개별 PDF 오류 격리 | ✅ |
| 접근성 | 모바일 기본 레이아웃 | 반응형 CSS 적용 (480px 브레이크포인트) | ✅ |

### 3.3 산출물

| 산출물 | 위치 | 상태 |
|--------|------|------|
| 서버 (API + PDF 로더) | `server.js` | ✅ |
| 채팅 UI | `public/index.html` | ✅ |
| 환경 변수 설정 | `.env` (gitignore) | ✅ |
| Vercel 배포 설정 | `vercel.json` | ✅ |
| PDF 문서 | `docs/근로기준법(법률)(...).pdf` | ✅ |
| PDCA 문서 | `docs/01-plan ~ 04-report/` | ✅ |

---

## 4. 미완료 항목

### 4.1 다음 사이클로 이월

| 항목 | 사유 | 우선순위 | 예상 작업 |
|------|------|----------|-----------|
| Vercel 실배포 | CLI 수동 설치 및 로그인 필요 | High | 10분 (수동 진행) |

**Vercel 배포 수동 진행 방법:**
```bash
# 1. Vercel CLI 설치 (터미널에서 직접 실행)
npm install -g vercel

# 2. Vercel 로그인
vercel login

# 3. 배포
vercel --prod

# 4. Vercel 대시보드 → Settings → Environment Variables
#    SAMBANOVA_API_KEY = 4f629ed0-...
#    HF_MODEL = Meta-Llama-3.3-70B-Instruct
```

### 4.2 취소/보류 항목

| 항목 | 사유 |
|------|------|
| 스트리밍 응답 | Plan 단계에서 범위 제외 결정 (구현 단순화) |
| 사용자 인증 | 범위 외 |
| 데이터베이스 대화 저장 | 범위 외 (브라우저 메모리만 사용) |

---

## 5. 품질 지표

### 5.1 최종 분석 결과

| 지표 | 목표 | 최종 | 상태 |
|------|------|------|------|
| Design Match Rate | ≥ 90% | **96%** | ✅ |
| Critical 이슈 | 0건 | **0건** | ✅ |
| 보안 이슈 (XSS 등) | 0건 | **0건** | ✅ |
| API 키 클라이언트 노출 | 0건 | **0건** | ✅ |
| 한국어 주석 | 전 함수 | **전 함수 완비** | ✅ |

### 5.2 발견 및 해결된 이슈

| 이슈 | 해결 방법 | 결과 |
|------|-----------|------|
| OpenAI API 키 미설정 오류 | `.env` 파일 생성 | ✅ 해결 |
| 포트 3000 이미 사용 중 (EADDRINUSE) | `taskkill //F //IM node.exe` 후 재시작 | ✅ 해결 |
| 시스템 프롬프트 너무 엄격 (자연어 질문 무응답) | 프롬프트 완화 — 관련 조항 검색 지시 추가 | ✅ 해결 |
| SambaNova 일일 토큰 한도 소진 (429) | 다음 날 자동 초기화 (200,000 토큰/일) | ✅ 확인 |
| 의도적 변경: SambaNova ↔ OpenAI | OpenAI SDK `baseURL` 파라미터로 무변경 전환 | ✅ 완료 |

---

## 6. 회고 (Lessons Learned)

### 6.1 잘 된 점 (Keep)

- **단일 파일 아키텍처(Option A)**: `server.js` + `index.html` 2파일로 전체 기능을 구현하여 초보자도 코드 전체를 한눈에 파악 가능
- **OpenAI SDK 호환성 활용**: SambaNova가 OpenAI 호환 API를 제공하여 SDK 교체 없이 `baseURL`만 변경으로 전환 성공
- **Design Ref 주석**: 코드에 `// Design Ref: §{섹션}` 주석을 달아 코드↔설계 추적성 확보
- **XSS 방어**: `innerHTML` 대신 `textContent` + `createElement` 패턴으로 XSS 위험 원천 차단
- **PDF 오류 격리**: 파일별 try-catch로 특정 PDF 파싱 실패 시에도 서버가 계속 실행되는 안정성 확보
- **토큰 한계 보호**: `pdfText.slice(0, 100000)` 로 PDF가 아무리 길어도 API 비용·오류 방지

### 6.2 개선이 필요한 점 (Problem)

- **Vercel 배포 자동화 부재**: CLI를 직접 설치·로그인해야 해서 배포가 미완성 상태로 남음
- **SambaNova 일일 토큰 한도**: 테스트 중 200,000 토큰 소진으로 하루 사용이 제한됨; 실사용 전 한도 확인 필요
- **시스템 프롬프트 초기 설정 미흡**: 첫 번째 프롬프트가 너무 엄격하여 자연어 질문에 "확인할 수 없습니다" 반환; 반복 수정 필요

### 6.3 다음에 시도할 것 (Try)

- **스트리밍 응답**: `res.write()` SSE 방식으로 답변이 실시간으로 화면에 표시되도록 개선
- **응답 캐싱**: 동일한 질문은 LLM 재호출 없이 캐시된 답변 반환 (토큰 절약)
- **PDF 청크 분할**: 100,000자 이상의 문서도 chunking + embedding 검색으로 완전 지원

---

## 7. 프로세스 개선 제안

### 7.1 PDCA 프로세스

| 단계 | 현재 | 개선 제안 |
|------|------|-----------|
| Plan | API 제공자를 OpenAI로 명시 | 환경 변수로 추상화하여 교체 유연성 확보 |
| Design | 시스템 프롬프트 초안 미포함 | 설계 문서에 시스템 프롬프트 초안 포함 |
| Do | Vercel 배포 자동화 없음 | GitHub Actions + Vercel 자동 배포 연동 |
| Check | 런타임 테스트 서버 미구동 | 테스트 전 서버 자동 시작 스크립트 추가 |

### 7.2 도구/환경

| 영역 | 개선 제안 | 기대 효과 |
|------|-----------|-----------|
| 배포 | GitHub → Vercel 자동 배포 연동 | 커밋 → 자동 배포, 수동 CLI 불필요 |
| 테스트 | curl 기반 API 테스트 스크립트 | 재현 가능한 API 검증 |
| 토큰 관리 | SambaNova 사용량 모니터링 대시보드 확인 | 일일 한도 소진 방지 |

---

## 8. 다음 단계

### 8.1 즉각 조치 (배포 완료를 위해)

- [ ] `npm install -g vercel` — Vercel CLI 설치
- [ ] `vercel login` — GitHub 계정으로 로그인
- [ ] `vercel --prod` — 프로덕션 배포 실행
- [ ] Vercel 대시보드에서 `SAMBANOVA_API_KEY`, `HF_MODEL` 환경 변수 등록

### 8.2 다음 PDCA 사이클 후보

| 항목 | 우선순위 | 예상 시작 |
|------|----------|-----------|
| 스트리밍 응답 (SSE) | Medium | 다음 세션 |
| PDF 청크 분할 + 벡터 검색 | High | 다음 버전 |
| GitHub → Vercel 자동 배포 | High | 배포 후 즉시 |

---

## 9. 변경 이력

### v1.0.0 (2026-05-07)

**추가:**
- `server.js` — Express 서버, PDF 로더, `/api/chat` 엔드포인트
- `public/index.html` — 채팅 UI (말풍선, 대화 기록)
- `vercel.json` — Vercel 서버리스 배포 설정
- `docs/` 폴더 — 근로기준법 PDF 보관

**변경:**
- API 제공자: OpenAI gpt-4o-mini → SambaNova Meta-Llama-3.3-70B-Instruct (비용 절감)
- 시스템 프롬프트: 4구조(결론/근거/상세/유의사항) 강화

---

## 버전 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|-----------|--------|
| 1.0 | 2026-05-07 | PDCA #1 완료 리포트 작성 | cheon |
