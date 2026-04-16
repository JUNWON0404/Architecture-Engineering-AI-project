import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from "docx";

interface ExportOptions {
  title: string;
  company?: string;
  position?: string;
  content: string;
}

// ── DOCX 내보내기 ──────────────────────────────────────────────
export async function exportDocx(options: ExportOptions): Promise<void> {
  const { title, company, position, content } = options;

  const metaLines: Paragraph[] = [];
  if (company || position) {
    metaLines.push(
      new Paragraph({
        children: [
          new TextRun({
            text: [company, position].filter(Boolean).join("  ·  "),
            color: "555555",
            size: 20,
          }),
        ],
        alignment: AlignmentType.LEFT,
        spacing: { after: 80 },
      })
    );
  }

  // 본문 단락 분리 (빈 줄 기준)
  const bodyParagraphs = content
    .split(/\n{2,}/)
    .flatMap((block) => {
      const lines = block.split("\n");
      return lines.map(
        (line, idx) =>
          new Paragraph({
            children: [new TextRun({ text: line, size: 22 })],
            spacing: { after: idx === lines.length - 1 ? 200 : 60 },
          })
      );
    });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
          },
        },
        children: [
          // 제목
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.LEFT,
            spacing: { after: 160 },
            border: {
              bottom: {
                style: BorderStyle.SINGLE,
                size: 6,
                color: "CCCCCC",
                space: 6,
              },
            },
          }),
          ...metaLines,
          // 빈 줄
          new Paragraph({ text: "", spacing: { after: 120 } }),
          ...bodyParagraphs,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${sanitizeFilename(title)}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── PDF 내보내기 (브라우저 인쇄 → Save as PDF) ─────────────────
export function exportPdf(options: ExportOptions): void {
  const { title, company, position, content } = options;

  const metaHtml =
    company || position
      ? `<p style="color:#555;font-size:13px;margin:0 0 24px;">${[company, position].filter(Boolean).join("&nbsp;&nbsp;·&nbsp;&nbsp;")}</p>`
      : "";

  const bodyHtml = content
    .split(/\n{2,}/)
    .map(
      (block) =>
        `<p style="margin:0 0 16px;line-height:1.9;">${block
          .split("\n")
          .join("<br/>")}</p>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8"/>
  <title>${escapeHtml(title)}</title>
  <style>
    @page { margin: 25mm 20mm; }
    body {
      font-family: "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif;
      font-size: 14px;
      color: #111;
      line-height: 1.8;
      max-width: 680px;
      margin: 0 auto;
      padding: 0;
    }
    h1 {
      font-size: 20px;
      font-weight: 900;
      margin: 0 0 8px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e2e8f0;
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  ${metaHtml}
  ${bodyHtml}
  <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }<\/script>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// ── 유틸 ──────────────────────────────────────────────────────
function sanitizeFilename(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, "_").trim() || "자소서";
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
