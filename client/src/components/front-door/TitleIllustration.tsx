import { useId } from 'react';
import titleGameplay from '../../assets/title-gameplay-v1.png';

/** Reuse the original hand-shaped title silhouette, with gameplay-based key art. */
export function TitleIllustration() {
  const clip = `title-outline-${useId().replace(/:/g, '')}`;
  return <svg className="title-illustration" viewBox="0 0 800 680" role="img"
    aria-label="A green ball follows a U-shaped track through three golden stars toward the exit. A message says: Turn off gravity.">
    <defs><clipPath id={clip}>
      <path d="M400 35C550 8 718 111 755 276c41 181-51 326-205 353C368 662 181 655 97 501 21 361 73 184 194 103 264 56 332 48 400 35Z" />
    </clipPath></defs>
    <image href={titleGameplay} x="48" y="0" width="720" height="680" preserveAspectRatio="none" clipPath={`url(#${clip})`} />
  </svg>;
}
