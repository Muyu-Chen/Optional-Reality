import { createContext, useEffect, useState, type ReactNode } from 'react';
import { MusicController } from './music-controller';

export const MusicContext = createContext<MusicController | null>(null);

/** Lives above the keyed Game so a new level never replaces the active track. */
export function MusicProvider({ children }: { children: ReactNode }) {
  const [controller, setController] = useState<MusicController | null>(null);
  useEffect(() => {
    // Construct inside the effect: StrictMode's cleanup/setup gets a fresh controller,
    // and discarded renders never own event listeners or an audio graph.
    const session = new MusicController(document);
    session.attach();
    setController(session);
    return () => session.dispose();
  }, []);
  return <MusicContext value={controller}>{children}</MusicContext>;
}
