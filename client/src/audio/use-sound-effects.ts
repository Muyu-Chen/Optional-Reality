import { useContext, useSyncExternalStore } from 'react';
import { SoundEffectsContext } from './SoundEffectsProvider';

const initial = { enabled: true, status: 'waiting' as const };
const initialSnapshot = () => initial;
const noSubscription = () => () => {};
const noToggle = () => {};

export function useSoundEffects() {
  const controller = useContext(SoundEffectsContext);
  const snapshot = useSyncExternalStore(controller?.subscribe || noSubscription, controller?.getSnapshot || initialSnapshot);
  return { ...snapshot, toggle: controller?.toggle || noToggle };
}
