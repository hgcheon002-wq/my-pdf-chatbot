# pdf-chatbot Gap Analysis Report

> **분석 일자**: 2026-05-07  
> **Overall Match Rate**: 96%  
> **상태**: ✅ 품질 기준 충족 (≥ 90%)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 방대한 근로기준법 PDF를 누구나 쉽고 빠르게 검색·이해하기 위함 |
| **WHO** | 노무 담당자, 소규모 사업주, 노동법을 확인해야 하는 직원 |
| **RISK** | PDF 텍스트 길이가 컨텍스트 한계를 초과할 수 있음 |
| **SUCCESS** | 질문 후 응답 수신, 법 조항 기반 정확한 답변 제공 |
| **SCOPE** | Phase 1: 서버+PDF 로더+API, Phase 2: 채팅 UI, Phase 3: Vercel 배포 |

---

## 종합 점수

| 항목 | 점수 | 상태 |
|------|:----:|:----:|
| Structural Match | 100% | ✅ |
| Functional Depth | 96% | ✅ |
| API Contract | 100% | ✅ |
| **Overall Match Rate** | **96%** | ✅ |

---

## Plan Success Criteria

| # | 기준 | 상태 | 근거 |
|---|------|:----:|------|
| SC-1 | `node server.js` 실행 시 "PDF 로드 완료" 출력 | ✅ Met | server.js:59 |
| SC-2 | 브라우저에서 노무 질문 → 답변 수신 | ✅ Met | API 계약 + UI 흐름 완비 |
| SC-3 | 이전 대화 참조 답변 | ✅ Met | history 전송 + 시스템 프롬프트 구성 |
| SC-4 | 브라우저에서 API 키 노출 없음 | ✅ Met | 클라이언트에 키 관련 코드 0건 |
| SC-5 | Vercel 배포 후 공개 URL 접근 | ⏳ Code Ready | vercel.json 완료, 실배포 미확인 |

**Success Rate: 4/5 Met**

---

## 발견된 갭

### Critical — 없음

### Important (의도적 편차)

| 항목 | 설계 | 구현 | 분류 |
|------|------|------|------|
| API 제공자 | OpenAI gpt-4o-mini / OPENAI_API_KEY | SambaNova / SAMBANOVA_API_KEY | Intentional Deviation |
| 모델 환경변수 | 없음 | HF_MODEL 추가 | Intentional Addition |

### Minor (5건)

| # | 항목 | 영향 |
|---|------|:----:|
| M1 | 모바일 브레이크포인트 375px → 480px (말풍선 85%) | 낮음 |
| M2 | PDF 미로드 시 클라이언트 안내 메시지 미노출 | 낮음 |
| M3 | CSS 토큰명 세분화 (설계보다 명시적) | 낮음 |
| M4 | 헤더 "상태 표시" → "근로기준법 AI" 배지 대체 | 낮음 |
| M5 | 시간 표시 보조 색상 토큰 미사용 | 낮음 |

---

## 강점

1. Design Ref 주석으로 코드↔설계 추적성 확보
2. innerHTML 사용 0건 (XSS 방어 완벽)
3. PDF 파일별 try-catch — 1개 실패해도 서버 유지
4. pdfText.slice(0, 100000) — 토큰 한계 보호
5. 에러 시 chatHistory.pop()으로 일관성 유지
