// =====================================================
// 노무 업무 어시스턴트 챗봇 - 서버 진입점
// Design Ref: §2 Option A — 단일 파일 구조
// Plan SC: PDF 기반 답변 + API 키 서버 전용 처리
// =====================================================

// ① 패키지 import 및 환경 변수 로드
// dotenv: .env 파일의 환경 변수를 process.env에 로드 (반드시 맨 위에서 호출)
require('dotenv').config();

const express = require('express'); // 웹 서버 프레임워크
const path    = require('path');    // 파일 경로 처리 유틸리티
const fs      = require('fs');      // 파일 시스템 접근
const pdf     = require('pdf-parse'); // PDF 텍스트 추출 라이브러리
const OpenAI  = require('openai');  // OpenAI 공식 SDK

// ⚠️ 보안: API 키는 반드시 서버에서만 사용. 절대 클라이언트에 노출 금지.
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Express 앱 인스턴스 생성
const app  = express();
// 포트 설정: 환경 변수 PORT가 있으면 사용, 없으면 3000번 사용
const PORT = process.env.PORT || 3000;

// ② PDF 로드 함수 정의
// docs/ 폴더의 모든 .pdf 파일을 읽어 텍스트를 합쳐서 반환하는 함수
async function loadPdfText() {
  // docs/ 폴더의 절대 경로를 구한다
  const docsDir = path.join(__dirname, 'docs');

  // docs/ 폴더가 존재하지 않으면 경고만 출력하고 빈 문자열 반환
  if (!fs.existsSync(docsDir)) {
    console.warn('⚠️  docs/ 폴더가 없습니다. PDF를 docs/ 폴더에 넣어주세요.');
    return '';
  }

  // docs/ 폴더 안에서 .pdf 확장자 파일만 골라낸다
  const pdfFiles = fs.readdirSync(docsDir).filter(file => file.endsWith('.pdf'));

  if (pdfFiles.length === 0) {
    console.warn('⚠️  docs/ 폴더에 PDF 파일이 없습니다.');
    return '';
  }

  let combinedText = '';

  // PDF 파일을 하나씩 읽어서 텍스트를 추출한 뒤 합친다
  for (const fileName of pdfFiles) {
    const filePath = path.join(docsDir, fileName);
    try {
      const buffer = fs.readFileSync(filePath); // 파일을 바이너리 버퍼로 읽기
      const data   = await pdf(buffer);         // pdf-parse로 텍스트 추출
      combinedText += data.text + '\n';
      console.log(`✅ PDF 로드 완료: ${fileName} (${data.text.length.toLocaleString()}자)`);
    } catch (err) {
      // 특정 파일 파싱 실패 시 해당 파일만 건너뛰고 서버는 계속 실행
      console.error(`❌ PDF 파싱 실패: ${fileName}`, err.message);
    }
  }

  return combinedText;
}

// ③ 서버 시작 시 PDF 로드 (비동기 즉시 실행 함수)
// pdfText는 모든 요청에서 공유되는 전역 변수
let pdfText = '';

// PDF를 미리 로드한 뒤 서버를 시작하는 초기화 함수
async function init() {
  pdfText = await loadPdfText();

  if (pdfText.length === 0) {
    // PDF가 없어도 서버는 실행됨 (에러 메시지로 안내)
    console.warn('⚠️  PDF 텍스트가 비어 있습니다. 챗봇이 PDF 내용 없이 동작합니다.');
  } else {
    console.log(`📄 총 PDF 텍스트 길이: ${pdfText.length.toLocaleString()}자`);
  }

  // ④ Express 미들웨어 설정
  // JSON 형태의 요청 본문을 파싱할 수 있게 설정
  app.use(express.json());

  // public/ 폴더의 정적 파일(HTML, CSS, JS 등)을 브라우저에 제공
  // 예: GET /index.html → public/index.html 파일 반환
  app.use(express.static(path.join(__dirname, 'public')));

  // ⑤ POST /api/chat 라우트 핸들러
  // 클라이언트에서 { message, history } 를 받아 OpenAI API를 호출하고 답변 반환
  app.post('/api/chat', async (req, res) => {
    // 요청 본문에서 사용자 메시지와 대화 기록을 꺼낸다
    const { message, history = [] } = req.body;

    // 빈 메시지 방지: 입력이 없으면 400 에러 반환
    if (!message || message.trim() === '') {
      return res.status(400).json({ error: '메시지를 입력해 주세요.' });
    }

    try {
      // OpenAI API에 전달할 messages 배열 구성
      // 순서: [시스템 지시] → [이전 대화 기록] → [현재 사용자 메시지]
      const messages = [
        {
          role: 'system',
          // 시스템 프롬프트: PDF 내용을 컨텍스트로 제공하고 PDF 기반 답변을 지시
          content: `당신은 노무 업무 전문가 AI 어시스턴트입니다.
아래 제공된 근로기준법 문서를 꼼꼼히 읽고, 사용자의 질문과 관련된 내용을 문서에서 찾아 답변하세요.
사용자가 자연어로 질문해도 문서에서 관련 조항을 찾아 답변하세요. 예: "연차휴가 며칠?" → 제60조 검색 후 답변.
문서를 충분히 검색했음에도 관련 내용이 전혀 없는 경우에만 "해당 내용은 제공된 문서에서 확인할 수 없습니다."라고 답하세요.
답변 시 관련 조항 번호(예: 제60조)를 반드시 함께 언급해 주세요.

=== 근로기준법 문서 내용 ===
${pdfText.slice(0, 100000)}
=== 문서 끝 ===`,
          // ⚠️ 토큰 한계 보호: PDF 전문이 너무 길 경우 앞 100,000자만 사용
        },
        // 이전 대화 기록을 그대로 포함 (맥락 유지)
        ...history,
        // 현재 사용자가 입력한 메시지
        {
          role: 'user',
          content: message,
        },
      ];

      // OpenAI gpt-4o-mini 모델로 답변 생성 요청
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // CLAUDE.md에서 지정된 모델
        messages: messages,
        max_tokens: 1000,     // 응답 최대 토큰 수 제한 (비용 절감)
        temperature: 0.3,     // 낮은 temperature: 보다 일관된 법률 답변 유도
      });

      // AI가 생성한 답변 텍스트 추출
      const reply = completion.choices[0].message.content;

      // 클라이언트에 JSON 형태로 답변 반환
      res.json({ reply });
    } catch (err) {
      // OpenAI API 호출 실패 시 500 에러 반환
      console.error('❌ OpenAI API 오류:', err.message);
      res.status(500).json({ error: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' });
    }
  });

  // ⑥ 서버 시작 (지정된 포트에서 HTTP 요청 대기)
  app.listen(PORT, () => {
    console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
    console.log(`📌 종료하려면 Ctrl+C 를 누르세요.`);
  });
}

// 초기화 함수 실행 (에러 발생 시 콘솔에 출력)
init().catch(err => {
  console.error('서버 초기화 실패:', err);
  process.exit(1);
});
