export function JourneyStars({ collected, total = 3 }: { collected: number; total?: number }) {
  return <span className="journey-stars" role="img" aria-label={`Best score ${collected} of ${total} stars`}>
    {Array.from({ length: total }, (_, index) => <svg key={index} viewBox="0 0 24 24"
      className={index < collected ? 'is-earned' : ''} aria-hidden="true">
      <path d="m12 2 3 6.2 6.8 1-4.9 4.8 1.2 6.8-6.1-3.2-6.1 3.2 1.2-6.8-4.9-4.8 6.8-1Z" />
    </svg>)}
  </span>;
}
