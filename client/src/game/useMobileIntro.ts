import { useEffect, useState } from 'react';

export const MOBILE_INTRO_QUERY = '(max-width: 720px), (pointer: coarse) and (max-height: 500px)';

/** Phone visitors can explore the introduction without mounting a physics world. */
export function useMobileIntro() {
  const [mobile, setMobile] = useState(() => typeof window.matchMedia === 'function' && window.matchMedia(MOBILE_INTRO_QUERY).matches);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia(MOBILE_INTRO_QUERY);
    const update = () => setMobile(media.matches);
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return mobile;
}
