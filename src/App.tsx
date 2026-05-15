import { useMemo, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist/legacy/build/pdf.mjs";
import { FilePicker } from "./components/FilePicker";
import { PageControls } from "./components/PageControls";
import { PdfMaskEditor } from "./components/PdfMaskEditor";
import { getMessages } from "./i18n/messages";
import type { NormalizedMaskRect, MasksByPage } from "./types/pdf";
import { generateSecureMaskedPdf } from "./utils/pdfRedactor";
import { loadPdfDocument } from "./utils/pdfRenderer";
import "./App.css";

function getSafeFileName(name: string): string {
  const dotIndex = name.lastIndexOf(".");
  if (dotIndex < 1) {
    return `${name}_safe_masked.pdf`;
  }
  return `${name.slice(0, dotIndex)}_safe_masked.pdf`;
}

function App() {
  const messages = useMemo(() => getMessages(), []);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [fileName, setFileName] = useState<string>("output_safe_masked.pdf");
  const [masksByPage, setMasksByPage] = useState<MasksByPage>({});
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [isRenderingPage, setIsRenderingPage] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressText, setProgressText] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [renderErrorMessage, setRenderErrorMessage] = useState<string>("");

  const totalPages = pdfDoc?.numPages ?? 0;

  const currentPageMasks = useMemo(() => masksByPage[currentPageIndex] ?? [], [masksByPage, currentPageIndex]);

  const handlePickFile = async (file: File) => {
    setErrorMessage("");
    setRenderErrorMessage("");
    setProgressText("");
    setIsLoadingPdf(true);

    try {
      const buffer = await file.arrayBuffer();
      const loadedPdf = await loadPdfDocument(buffer);

      setPdfDoc(loadedPdf);
      setMasksByPage({});
      setCurrentPageIndex(0);
      setFileName(getSafeFileName(file.name));
    } catch (error) {
      const message = error instanceof Error ? error.message : messages.errors.loadPdfFallback;
      setErrorMessage(`${messages.errors.loadPdfPrefix}: ${message}`);
      setPdfDoc(null);
    } finally {
      setIsLoadingPdf(false);
    }
  };

  const addMaskForCurrentPage = (mask: NormalizedMaskRect) => {
    setMasksByPage((prev) => {
      const existing = prev[currentPageIndex] ?? [];
      return {
        ...prev,
        [currentPageIndex]: [...existing, mask],
      };
    });
  };

  const handleUndoLastMask = () => {
    setMasksByPage((prev) => {
      const existing = prev[currentPageIndex] ?? [];
      if (existing.length === 0) {
        return prev;
      }

      const trimmed = existing.slice(0, -1);
      return {
        ...prev,
        [currentPageIndex]: trimmed,
      };
    });
  };

  const handleGenerate = async () => {
    if (!pdfDoc) {
      return;
    }

    setErrorMessage("");
    setIsGenerating(true);
    setProgressText(messages.generatingProgress);

    try {
      const outputBytes = await generateSecureMaskedPdf({
        sourcePdf: pdfDoc,
        masksByPage,
        outputScale: 2,
        onProgress: (done, total) => {
          setProgressText(messages.generatingProgressWithCount(done, total));
        },
      });

      const blobBytes = new Uint8Array(outputBytes);
      const blob = new Blob([blobBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();

      URL.revokeObjectURL(url);
      setProgressText(messages.generationCompleted);
    } catch (error) {
      const message = error instanceof Error ? error.message : messages.errors.generatePdfFallback;
      setErrorMessage(`${messages.errors.generatePdfPrefix}: ${message}`);
      setProgressText("");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>RedactPDF</h1>
        <p>{messages.appDescription}</p>
      </header>

      <section className="panel">
        <FilePicker
          onPickFile={handlePickFile}
          disabled={isLoadingPdf || isGenerating}
          label={messages.filePickerLabel}
        />
        {isLoadingPdf && <p className="status">{messages.loadingPdf}</p>}
        {errorMessage && <p className="error">{errorMessage}</p>}
        {renderErrorMessage && (
          <p className="error">
            {messages.renderErrorPrefix}: {renderErrorMessage}
          </p>
        )}
      </section>

      <section className="panel controls-panel">
        <PageControls
          currentPage={currentPageIndex + 1}
          totalPages={totalPages}
          onPrev={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
          onNext={() => setCurrentPageIndex((prev) => Math.min(totalPages - 1, prev + 1))}
          disabled={!pdfDoc || isLoadingPdf || isGenerating}
          ariaLabel={messages.pageControls.ariaLabel}
          prevLabel={messages.pageControls.previous}
          nextLabel={messages.pageControls.next}
        />

        <div className="action-row">
          <button
            type="button"
            onClick={handleUndoLastMask}
            disabled={!pdfDoc || currentPageMasks.length === 0 || isGenerating}
          >
            {messages.undoLastMask}
          </button>
          <button
            type="button"
            className="primary"
            onClick={handleGenerate}
            disabled={!pdfDoc || isLoadingPdf || isRenderingPage || isGenerating}
          >
            {messages.downloadRedactedPdf}
          </button>
        </div>
        {progressText && <p className="status">{progressText}</p>}
      </section>

      <section className="panel viewer-panel">
        {!pdfDoc && <p className="status">{messages.viewerPlaceholder}</p>}
        {pdfDoc && (
          <PdfMaskEditor
            pdfDoc={pdfDoc}
            pageIndex={currentPageIndex}
            masks={currentPageMasks}
            maxWidthPx={1000}
            disabled={isGenerating}
            onAddMask={addMaskForCurrentPage}
            onRenderStateChange={setIsRenderingPage}
            onRenderError={setRenderErrorMessage}
            ariaLabel={messages.editor.ariaLabel}
            loadingMessage={messages.editor.loadingPage}
            sizeLabel={messages.editor.sizeLabel}
            renderFailedFallback={messages.editor.renderFailedFallback}
          />
        )}
      </section>
    </main>
  );
}

export default App;
