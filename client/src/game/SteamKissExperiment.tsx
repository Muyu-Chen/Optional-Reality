import { useEffect, useRef } from 'react';
import { mountSteamKiss } from '../../experiments/steam-kiss/main.js';
import scene from '../../experiments/steam-kiss/scene.html?raw';
import '../../experiments/steam-kiss/style.css';

/** Optional replacement of 03.3 only. Its runtime does not touch the main game's progress or physics. */
export function SteamKissExperiment({ onBack }: { onBack: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const back = useRef(onBack);
  back.current = onBack;
  useEffect(() => {
    if (!root.current) return;
    const previous = document.title;
    document.title = 'Kiss of Steam — Optional Reality';
    const dispose = mountSteamKiss(root.current, () => back.current());
    return () => { dispose(); document.title = previous; };
  }, []);
  return <div id="steam-experiment" ref={root} dangerouslySetInnerHTML={{ __html: scene }} />;
}
