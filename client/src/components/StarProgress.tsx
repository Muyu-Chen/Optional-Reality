import { useEffect, useRef, useState } from 'react';

export function StarProgress({collected,total}: {collected:number;total:number}) {
  const previous = useRef({ collected, total });
  const [pickup, setPickup] = useState(0);
  useEffect(() => {
    const gained = previous.current.total === total && collected > previous.current.collected;
    previous.current = { collected, total };
    setPickup(gained ? collected : 0);
  }, [collected, total]);
  if(!total)return null;
  return <span className="star-progress" role="status" aria-label={`Stars ${collected} of ${total}`}>
    <span key={pickup} className={`star-progress-content${pickup ? ' star-progress-content--pickup' : ''}`} aria-hidden="true">
      <span className="star-progress-icon">
        <svg viewBox="0 0 24 24" focusable="false"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8l-6.2 3.3L7 14.2l-5-4.9 6.9-1Z" /></svg>
      </span>
      <span className="star-progress-number">{collected}</span><span className="star-progress-total">/{total}</span>
    </span>
  </span>;
}
