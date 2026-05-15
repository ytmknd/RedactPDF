export type AppMessages = {
  appDescription: string;
  loadingPdf: string;
  renderErrorPrefix: string;
  undoLastMask: string;
  downloadRedactedPdf: string;
  viewerPlaceholder: string;
  generatingProgress: string;
  generatingProgressWithCount: (done: number, total: number) => string;
  generationCompleted: string;
  filePickerLabel: string;
  pageControls: {
    ariaLabel: string;
    previous: string;
    next: string;
  };
  editor: {
    ariaLabel: string;
    loadingPage: string;
    sizeLabel: string;
    renderFailedFallback: string;
  };
  errors: {
    loadPdfFallback: string;
    loadPdfPrefix: string;
    generatePdfFallback: string;
    generatePdfPrefix: string;
  };
};

const JA_MESSAGES: AppMessages = {
  appDescription:
    "PDFを安全に黒塗りします。黒塗り部分は出力PDFから復元できないよう画像化して再生成します。",
  loadingPdf: "PDFを読み込み中です...",
  renderErrorPrefix: "ページ描画エラー",
  undoLastMask: "最後のマスクを取り消す",
  downloadRedactedPdf: "安全な黒塗りPDFをダウンロード",
  viewerPlaceholder: "PDFを選択するとここにページが表示されます。",
  generatingProgress: "安全な黒塗りPDFを生成中...",
  generatingProgressWithCount: (done, total) => `安全な黒塗りPDFを生成中... ${done}/${total}ページ`,
  generationCompleted: "生成が完了しました。ダウンロードを開始しました。",
  filePickerLabel: "PDFファイルを選択",
  pageControls: {
    ariaLabel: "ページ操作",
    previous: "前へ",
    next: "次へ",
  },
  editor: {
    ariaLabel: "PDFページ編集エリア",
    loadingPage: "PDFページを表示中...",
    sizeLabel: "表示サイズ",
    renderFailedFallback: "ページ描画に失敗しました。",
  },
  errors: {
    loadPdfFallback: "PDFの読み込みに失敗しました。",
    loadPdfPrefix: "PDF読み込みエラー",
    generatePdfFallback: "PDF生成に失敗しました。",
    generatePdfPrefix: "PDF生成エラー",
  },
};

const EN_MESSAGES: AppMessages = {
  appDescription:
    "Redact PDFs securely. Masked areas are rasterized and rebuilt so the original content cannot be recovered from the output PDF.",
  loadingPdf: "Loading PDF...",
  renderErrorPrefix: "Page render error",
  undoLastMask: "Undo last mask",
  downloadRedactedPdf: "Download securely redacted PDF",
  viewerPlaceholder: "Select a PDF to preview pages here.",
  generatingProgress: "Generating securely redacted PDF...",
  generatingProgressWithCount: (done, total) =>
    `Generating securely redacted PDF... ${done}/${total} pages`,
  generationCompleted: "Generation completed. Download started.",
  filePickerLabel: "Select PDF file",
  pageControls: {
    ariaLabel: "Page controls",
    previous: "Previous",
    next: "Next",
  },
  editor: {
    ariaLabel: "PDF page editor",
    loadingPage: "Rendering PDF page...",
    sizeLabel: "Display size",
    renderFailedFallback: "Failed to render page.",
  },
  errors: {
    loadPdfFallback: "Failed to load PDF.",
    loadPdfPrefix: "PDF load error",
    generatePdfFallback: "Failed to generate PDF.",
    generatePdfPrefix: "PDF generation error",
  },
};

export type AppLocale = "ja" | "en";

export function detectAppLocale(): AppLocale {
  if (typeof navigator === "undefined") {
    return "en";
  }
  return navigator.language.toLowerCase().startsWith("ja") ? "ja" : "en";
}

export function getMessages(locale = detectAppLocale()): AppMessages {
  return locale === "ja" ? JA_MESSAGES : EN_MESSAGES;
}
