import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { NormalizedMaskRect } from "../types/pdf";
import { renderPageToCanvas, type RenderedPageInfo } from "../utils/pdfRenderer";

type DraftRectPx = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

type PdfMaskEditorProps = {
  pdfDoc: PDFDocumentProxy;
  pageIndex: number;
  masks: NormalizedMaskRect[];
  maxWidthPx: number;
  disabled?: boolean;
  onAddMask: (mask: NormalizedMaskRect) => void;
  onRenderStateChange?: (isRendering: boolean) => void;
  onPageInfo?: (info: RenderedPageInfo) => void;
  onRenderError?: (message: string) => void;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toNormalizedRect(draft: DraftRectPx, width: number, height: number): NormalizedMaskRect | null {
  const xMin = Math.min(draft.x1, draft.x2);
  const xMax = Math.max(draft.x1, draft.x2);
  const yMin = Math.min(draft.y1, draft.y2);
  const yMax = Math.max(draft.y1, draft.y2);

  const rectWidth = xMax - xMin;
  const rectHeight = yMax - yMin;

  if (rectWidth < 3 || rectHeight < 3) {
    return null;
  }

  return {
    x: xMin / width,
    y: yMin / height,
    width: rectWidth / width,
    height: rectHeight / height,
  };
}

export function PdfMaskEditor({
  pdfDoc,
  pageIndex,
  masks,
  maxWidthPx,
  disabled = false,
  onAddMask,
  onRenderStateChange,
  onPageInfo,
  onRenderError,
}: PdfMaskEditorProps) {
  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [renderInfo, setRenderInfo] = useState<RenderedPageInfo | null>(null);
  const [draftRect, setDraftRect] = useState<DraftRectPx | null>(null);
  const [pointerActive, setPointerActive] = useState(false);

  const canvasSize = useMemo(
    () => ({ width: renderInfo?.widthPx ?? 0, height: renderInfo?.heightPx ?? 0 }),
    [renderInfo],
  );

  useEffect(() => {
    let cancelled = false;
    const abortController = new AbortController();

    const render = async () => {
      const baseCanvas = baseCanvasRef.current;
      const overlayCanvas = overlayCanvasRef.current;
      if (!baseCanvas || !overlayCanvas) {
        return;
      }

      try {
        onRenderStateChange?.(true);
        const page = await pdfDoc.getPage(pageIndex + 1);
        const info = await renderPageToCanvas({
          page,
          canvas: baseCanvas,
          maxWidthPx,
          abortSignal: abortController.signal,
        });

        if (cancelled) {
          return;
        }

        overlayCanvas.width = info.widthPx;
        overlayCanvas.height = info.heightPx;

        setRenderInfo(info);
        onPageInfo?.(info);
        onRenderError?.("");
      } catch (error) {
        if (
          error instanceof Error &&
          (error.name === "RenderingCancelledException" || error.name === "AbortError")
        ) {
          return;
        }

        if (!cancelled) {
          setRenderInfo(null);
          const message = error instanceof Error ? error.message : "ページ描画に失敗しました。";
          onRenderError?.(message);
        }
      } finally {
        if (!cancelled) {
          onRenderStateChange?.(false);
        }
      }
    };

    void render();

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [maxWidthPx, onPageInfo, onRenderError, onRenderStateChange, pageIndex, pdfDoc]);

  useEffect(() => {
    const overlayCanvas = overlayCanvasRef.current;
    if (!overlayCanvas) {
      return;
    }

    const ctx = overlayCanvas.getContext("2d");
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = "#000000";
    for (const mask of masks) {
      ctx.fillRect(
        Math.round(mask.x * overlayCanvas.width),
        Math.round(mask.y * overlayCanvas.height),
        Math.round(mask.width * overlayCanvas.width),
        Math.round(mask.height * overlayCanvas.height),
      );
    }
    ctx.restore();

    if (draftRect) {
      const x = Math.min(draftRect.x1, draftRect.x2);
      const y = Math.min(draftRect.y1, draftRect.y2);
      const width = Math.abs(draftRect.x2 - draftRect.x1);
      const height = Math.abs(draftRect.y2 - draftRect.y1);

      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = "#000000";
      ctx.fillRect(x, y, width, height);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "#ffb703";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(x, y, width, height);
      ctx.restore();
    }
  }, [draftRect, masks]);

  const getLocalPoint = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const scaleX = rect.width > 0 ? event.currentTarget.width / rect.width : 1;
    const scaleY = rect.height > 0 ? event.currentTarget.height / rect.height : 1;
    const x = clamp((event.clientX - rect.left) * scaleX, 0, event.currentTarget.width);
    const y = clamp((event.clientY - rect.top) * scaleY, 0, event.currentTarget.height);
    return {
      x,
      y,
    };
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (disabled || !renderInfo) {
      return;
    }

    const point = getLocalPoint(event);
    setDraftRect({ x1: point.x, y1: point.y, x2: point.x, y2: point.y });
    setPointerActive(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!pointerActive || !renderInfo) {
      return;
    }

    const point = getLocalPoint(event);
    setDraftRect((prev) =>
      prev
        ? {
            ...prev,
            x2: point.x,
            y2: point.y,
          }
        : prev,
    );
  };

  const finalizeDraft = () => {
    if (!draftRect || !renderInfo) {
      setDraftRect(null);
      setPointerActive(false);
      return;
    }

    const normalized = toNormalizedRect(draftRect, renderInfo.widthPx, renderInfo.heightPx);
    if (normalized) {
      onAddMask(normalized);
    }

    setDraftRect(null);
    setPointerActive(false);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!pointerActive) {
      return;
    }
    event.currentTarget.releasePointerCapture(event.pointerId);
    finalizeDraft();
  };

  const handlePointerCancel = () => {
    setDraftRect(null);
    setPointerActive(false);
  };

  return (
    <div className="pdf-editor" aria-label="PDFページ編集エリア">
      <canvas ref={baseCanvasRef} className="pdf-canvas" />
      <canvas
        ref={overlayCanvasRef}
        className="overlay-canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      />
      {!renderInfo && <div className="editor-placeholder">PDFページを表示中...</div>}
      {renderInfo && (
        <div className="canvas-size-note">
          表示サイズ: {canvasSize.width} x {canvasSize.height}px
        </div>
      )}
    </div>
  );
}
