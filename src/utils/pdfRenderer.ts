import { GlobalWorkerOptions, getDocument, type PDFDocumentProxy, type PDFPageProxy } from "pdfjs-dist/legacy/build/pdf.mjs";

GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString();

export type RenderedPageInfo = {
  widthPx: number;
  heightPx: number;
  pageWidthPt: number;
  pageHeightPt: number;
};

export async function loadPdfDocument(data: ArrayBuffer): Promise<PDFDocumentProxy> {
  const loadingTask = getDocument({
    data,
    useWorkerFetch: true,
  });
  return loadingTask.promise;
}

export async function renderPageToCanvas(params: {
  page: PDFPageProxy;
  canvas: HTMLCanvasElement;
  maxWidthPx: number;
  abortSignal?: AbortSignal;
}): Promise<RenderedPageInfo> {
  const { page, canvas, maxWidthPx, abortSignal } = params;
  const baseViewport = page.getViewport({ scale: 1 });
  const scale = Math.max(0.1, maxWidthPx / baseViewport.width);
  const viewport = page.getViewport({ scale });

  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context を取得できませんでした。");
  }

  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  const renderTask = page.render({
    canvas,
    canvasContext: ctx,
    viewport,
    background: "#ffffff",
  });

  const abortHandler = () => {
    renderTask.cancel();
  };

  if (abortSignal) {
    if (abortSignal.aborted) {
      renderTask.cancel();
    } else {
      abortSignal.addEventListener("abort", abortHandler, { once: true });
    }
  }

  try {
    await renderTask.promise;
  } finally {
    abortSignal?.removeEventListener("abort", abortHandler);
  }

  return {
    widthPx: canvas.width,
    heightPx: canvas.height,
    pageWidthPt: baseViewport.width,
    pageHeightPt: baseViewport.height,
  };
}
