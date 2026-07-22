import { ChevronLeft, ChevronRight } from "lucide-react";

interface CarouselControlsProps {
  onPrevious: () => void;
  onNext: () => void;
  previousDisabled: boolean;
  nextDisabled: boolean;
  previousLabel: string;
  nextLabel: string;
  className?: string;
}

export function CarouselControls({
  onPrevious,
  onNext,
  previousDisabled,
  nextDisabled,
  previousLabel,
  nextLabel,
  className = "",
}: CarouselControlsProps) {
  if (previousDisabled && nextDisabled) return null;

  return (
    <div className={`tt-carousel-controls ${className}`.trim()} role="group">
      <button
        type="button"
        className="tt-carousel-arrow"
        onClick={onPrevious}
        disabled={previousDisabled}
        aria-label={previousLabel}
      >
        <ChevronLeft aria-hidden />
      </button>
      <button
        type="button"
        className="tt-carousel-arrow"
        onClick={onNext}
        disabled={nextDisabled}
        aria-label={nextLabel}
      >
        <ChevronRight aria-hidden />
      </button>
    </div>
  );
}

interface CarouselPaginationProps {
  current: number;
  total: number;
  onChange: (index: number) => void;
  label: string;
  pageLabel: (index: number) => string;
  className?: string;
}

export function CarouselPagination({
  current,
  total,
  onChange,
  label,
  pageLabel,
  className = "",
}: CarouselPaginationProps) {
  if (total <= 1) return null;

  return (
    <div className={`tt-carousel-pagination ${className}`.trim()} role="group" aria-label={label}>
      {Array.from({ length: total }, (_, index) => (
        <button
          key={index}
          type="button"
          className={index === current ? "is-active" : undefined}
          onClick={() => onChange(index)}
          aria-label={pageLabel(index)}
          aria-current={index === current ? "true" : undefined}
        />
      ))}
    </div>
  );
}
