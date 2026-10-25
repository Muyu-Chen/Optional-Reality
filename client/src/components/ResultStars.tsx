export function ResultStars({ collected, total }: { collected: number; total: number }) {
  if (!total) return null;
  return <div className="result-stars" role="status" aria-label={`Stars ${collected} of ${total}`}>
    <div className="result-star-row" aria-hidden="true">
      {Array.from({ length: total }, (_, index) => <span
        className={`result-star${index < collected ? ' result-star--collected' : ''}`}
        style={{ animationDelay: `${120 + index * 100}ms` }} key={index}
      >
        <svg viewBox="0 0 100 100" focusable="false">
          <path className="result-star-shape" d="m50 8 12.7 25.7 28.4 4.1-20.5 20 4.8 28.3L50 72.7 24.6 86.1l4.8-28.3-20.5-20 28.4-4.1Z" />
          <path className="result-star-shine" d="m50 22-8.7 17.6-19.4 2.8" />
        </svg>
      </span>)}
    </div>
    <p className="result-star-count" aria-hidden="true"><strong>{collected}</strong> / {total} <span>STARS</span></p>
  </div>;
}
