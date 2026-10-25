export function StarProgress({collected,total}: {collected:number;total:number}) {
  if(!total)return null;
  return <span className="star-progress" role="status" aria-label={`Stars ${collected} of ${total}`}>
    <span aria-hidden="true">★</span> {collected}/{total}
  </span>;
}
