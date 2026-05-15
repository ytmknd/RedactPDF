type PageControlsProps = {
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  disabled?: boolean;
  ariaLabel: string;
  prevLabel: string;
  nextLabel: string;
};

export function PageControls({
  currentPage,
  totalPages,
  onPrev,
  onNext,
  disabled = false,
  ariaLabel,
  prevLabel,
  nextLabel,
}: PageControlsProps) {
  const isFirst = currentPage <= 1;
  const isLast = currentPage >= totalPages;

  return (
    <div className="page-controls" role="group" aria-label={ariaLabel}>
      <button type="button" onClick={onPrev} disabled={disabled || isFirst}>
        {prevLabel}
      </button>
      <span className="page-indicator">
        {currentPage} / {Math.max(totalPages, 1)}
      </span>
      <button type="button" onClick={onNext} disabled={disabled || isLast}>
        {nextLabel}
      </button>
    </div>
  );
}
