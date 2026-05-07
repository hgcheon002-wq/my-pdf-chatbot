# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# 노무 업무 어시스턴트 챗봇

근로기준법 등 노무 관련 PDF를 읽고 사용자 질문에 답변하는 챗봇.  
Node.js + Express 백엔드, 바닐라 HTML/CSS/JS 프론트엔드, OpenAI API(`gpt-4o-mini`) 사용, Vercel 배포.

---

## 개발 명령어

```bash
npm install      # 최초 1회 또는 패키지 추가 후 실행
node server.js   # 개발 서버 실행 (기본 포트: 3000)
```

테스트 프레임워크는 현재 없음. 서버 동작 확인은 브라우저 또는 curl로 직접 검증한다.

---

## 아키텍처

```
사용자 브라우저
    │  POST /api/chat  { message }
    ▼
server.js (Express)
    ├── docs/ 폴더의 PDF를 서버 시작 시 1회 읽어 텍스트로 변환 (pdf-parse 등 사용)
    ├── 변환된 텍스트를 시스템 프롬프트에 삽입
    └── OpenAI API 호출 → 응답을 클라이언트에 반환
        
public/
    └── index.html + (CSS/JS 인라인 또는 별도 파일)
        채팅 UI, /api/chat 엔드포인트로 fetch 요청
```

**핵심 흐름**: PDF는 서버 기동 시 메모리에 로드 → 매 요청마다 PDF 텍스트를 컨텍스트로 포함한 프롬프트를 OpenAI에 전송 → 스트리밍 또는 단일 응답 반환.

---

## 필수 규칙

### 보안
- `.env` 파일은 **절대 수정하거나 Git에 추가하지 말 것**
- `OPENAI_API_KEY`는 `server.js`에서만 `process.env.OPENAI_API_KEY`로 참조. 프론트엔드 노출 금지.

### PDF 관리
- PDF 파일은 반드시 `docs/` 폴더에 보관 (현재 루트에 있는 `근로기준법(법률)(제20520호)(20250223).pdf`는 `docs/`로 이동 필요)
- `docs/` 외 경로에 PDF 저장 금지

### 코드 스타일
- 모든 주석은 **한국어**로 작성
- 함수마다 역할을 설명하는 한국어 주석 필수
- 초보자가 헷갈릴 만한 로직에는 추가 설명 주석 작성

---

## 환경 변수

```
OPENAI_API_KEY=여기에_API_키_입력
```

---

## 배포 (Vercel)

- Vercel 대시보드 → Settings → Environment Variables에서 `OPENAI_API_KEY` 등록 필수
- `vercel.json`이 없으면 Vercel이 `server.js`를 서버리스 함수로 인식하지 못할 수 있으므로, Express 앱을 서버리스로 감싸거나 `vercel.json`에 라우팅 설정 필요
