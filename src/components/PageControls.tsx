type PageControlsProps = {
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  disabled?: boolean;
};

export function PageControls({
  currentPage,
  totalPages,
  onPrev,
  onNext,
  disabled = false,
}: PageControlsProps) {
  const isFirst = currentPage <= 1;
  const isLast = currentPage >= totalPages;

  return (
    <div className="page-controls" role="group" aria-label="ページ操作">
      <button type="button" onClick={onPrev} disabled={disabled || isFirst}>
        前へ
      </button>
      <span className="page-indicator">
        {currentPage} / {Math.max(totalPages, 1)}
      </span>
      <button type="button" onClick={onNext} disabled={disabled || isLast}>
        次へ
      </button>
    </div>
  );
}
