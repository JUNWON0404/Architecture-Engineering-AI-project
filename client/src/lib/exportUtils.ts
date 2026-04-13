/**
 * 자소서 데이터를 워드(.docx) 호환 파일로 변환하여 다운로드합니다.
 */
export const exportToWord = (data: {
  title: string;
  company?: string;
  position?: string;
  major?: string;
  gpa?: string;
  certifications?: string;
  content: string;
}) => {
  const { title, company, position, major, gpa, certifications, content } = data;

  // 워드에서 인식 가능한 HTML 템플릿
  const header = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Export To Word</title>
    <style>
      body { font-family: 'Malgun Gothic', 'Dotum', sans-serif; line-height: 1.6; }
      .header { text-align: center; margin-bottom: 50px; }
      .title { font-size: 24pt; font-weight: bold; }
      .section-title { font-size: 16pt; font-weight: bold; border-bottom: 2px solid #333; margin-top: 30px; margin-bottom: 15px; padding-bottom: 5px; }
      .info-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
      .info-table th, .info-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
      .info-table th { background-color: #f9f9f9; width: 25%; font-weight: bold; }
      .content-box { white-space: pre-wrap; font-size: 11pt; }
    </style>
    </head><body>
  `;

  const footer = "</body></html>";

  const body = `
    <div class="header">
      <div class="title">${company || "마스터"} 자기소개서</div>
      <p style="color: #666;">${title}</p>
    </div>

    <div class="section-title">기본 정보</div>
    <table class="info-table">
      <tr>
        <th>지원 기업</th><td>${company || "미정"}</td>
        <th>지원 직무</th><td>${position || "미정"}</td>
      </tr>
      <tr>
        <th>전공</th><td>${major || "미정"}</td>
        <th>학점</th><td>${gpa || "미정"}</td>
      </tr>
      <tr>
        <th>자격증</th><td colspan="3">${certifications || "정보 없음"}</td>
      </tr>
    </table>

    <div class="section-title">자기소개서 본문</div>
    <div class="content-box">
      ${content.replace(/\n/g, '<br/>')}
    </div>
  `;

  const fullHtml = header + body + footer;

  // Blob 생성 및 다운로드
  const blob = new Blob(['\ufeff' + fullHtml], {
    type: 'application/msword'
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `[${company || "마스터"}]_자기소개서_${new Date().toISOString().slice(0, 10)}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
