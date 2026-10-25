import { useContext, useSyncExternalStore } from 'react';
import type { MusicSnapshot } from './music-controller';
import { MusicContext } from './MusicProvider';

const initial: MusicSnapshot = { enabled: true, status: 'waiting' };
const initialSnapshot = () => initial;
const noSubscription = () => () => {};
const noToggle = () => {};

export function useBackgroundMusic() {
  const controller = useContext(MusicContext);
  const snapshot = useSyncExternalStore(controller?.subscribe || noSubscription, controller?.getSnapshot || initialSnapshot);
  return { ...snapshot, toggle: controller?.toggle || noToggle };
}
