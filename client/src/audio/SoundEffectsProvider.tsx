import { createContext, useEffect, useState, type ReactNode } from 'react';
import { SfxController } from './sfx-controller';

export const SoundEffectsContext = createContext<SfxController | null>(null);

// Remains above the keyed Game: one optional effects context for the whole visit.
export function SoundEffectsProvider({ children }: { children: ReactNode }) {
  const [controller, setController] = useState<SfxController | null>(null);
  useEffect(() => {
    const session = new SfxController(document);session.attach();setController(session);
    return () => session.dispose();
  }, []);
  return <SoundEffectsContext value={controller}>{children}</SoundEffectsContext>;
}
