import { useState } from 'react';
import { MusicProvider } from './audio/MusicProvider';
import { Game } from './game/Game';
import { findLevel } from './levels/catalog';
import { gravityLab } from './levels/gravity-lab';

export default function App() {
  const [level, setLevel] = useState(() => (
    findLevel(new URLSearchParams(window.location.search).get('level') || '') || gravityLab
  ));

  function chooseLevel(id: string) {
    const next = findLevel(id);
    if (!next) return;
    const url = new URL(window.location.href);
    url.searchParams.set('level', next.id);
    window.history.replaceState(null, '', url);
    setLevel(next);
  }

  return <MusicProvider><Game key={level.id} level={level} chooseLevel={chooseLevel} /></MusicProvider>;
}
